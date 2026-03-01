from rest_framework import generics, status
from rest_framework.response import Response
from .models import SubscriptionPlan, UserSubscription, UserSubscriptionPayments
from .serializers import SubscriptionPlanSerializer, UserSubscriptionSerializer, UserSubscriptionPaymentsSerializer
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.shortcuts import get_object_or_404
from django.utils import timezone
from datetime import timedelta
from django.conf import settings
import razorpay
from rest_framework.decorators import api_view, permission_classes
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
import json
# from .utils import send_payment_receipt_email_async  # Uncomment when implemented

client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))

class SubscriptionPlanListRetrieveView(generics.ListAPIView):
    queryset = SubscriptionPlan.objects.all()
    serializer_class = SubscriptionPlanSerializer
    permission_classes = [AllowAny]


class UserSubscriptionRetrieveUpdateView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSubscriptionSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        try:
            return UserSubscription.objects.filter(user=self.request.user, active=True).first()
        except UserSubscription.DoesNotExist:
            return None

    def get(self, request, *args, **kwargs):
        instance = self.get_object()
        if not instance:
            return Response({
                "message": "No active subscription found",
                "has_subscription": False
            }, status=status.HTTP_200_OK)
        serializer = self.get_serializer(instance)
        return Response({
            **serializer.data,
            "has_subscription": True,
            "user": {
                "name": request.user.name,
                "email": request.user.email,
                "phone": request.user.phone,
            },
            "plan": {
                "id": instance.plan.id,
                "name": instance.plan.name,
                "description": instance.plan.description,
                "user_type": instance.plan.user_type,
                "price": instance.plan.price,
                "currency": instance.plan.currency
            }
        })

    def put(self, request, *args, **kwargs):
        instance = self.get_object()
        if not instance:
            return Response({
                "message": "No active subscription found",
                "has_subscription": False
            }, status=status.HTTP_404_NOT_FOUND)
        return super().put(request, *args, **kwargs)


class UserSubscriptionCreateView(generics.CreateAPIView):
    serializer_class = UserSubscriptionSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        plan_id = request.data.get('plan')
        if not plan_id:
            return Response(
                {'error': 'Plan ID is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            plan = SubscriptionPlan.objects.get(id=plan_id)
        except SubscriptionPlan.DoesNotExist:
            return Response(
                {'error': 'Invalid plan ID'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if plan.price == 0:
            return Response(
                {'error': 'Contact to Zyukthi Support!'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if user already has an active subscription
        if UserSubscription.objects.filter(user=request.user, active=True).exists():
            UserSubscription.objects.filter(user=request.user, active=True).update(active=False)
            # return Response(
            #     {'error': 'User already has an active subscription'},
            #     status=status.HTTP_400_BAD_REQUEST
            # )

        # Create new subscription
        subscription = UserSubscription.objects.create(
            user=request.user,
            plan=plan,
            end_date=timezone.now() + timedelta(days=30),
            active=True
        )

        serializer = self.get_serializer(subscription)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_subscription_order(request):
    try:
        if not settings.RAZORPAY_KEY_ID or not settings.RAZORPAY_KEY_SECRET:
            return JsonResponse({'error': 'Razorpay is not configured on server'}, status=500)

        data = request.data
        plan_id = data.get('plan_id')
        if not plan_id:
            return JsonResponse({'error': 'Plan ID is required'}, status=400)
        plan = get_object_or_404(SubscriptionPlan, id=plan_id)
        # Create new subscription (inactive until payment)
        subscription = UserSubscription.objects.create(
            user=request.user,
            plan=plan,
            end_date=None,
            active=False
        )
        # Create payment record
        payment = UserSubscriptionPayments.objects.create(
            user=request.user,
            subscription=subscription,
            amount=plan.price,
            currency=plan.currency,
            status='created'
        )
        # Create Razorpay order
        razorpay_order = client.order.create({
            'amount': int(float(plan.price) * 100),
            'currency': plan.currency,
            'payment_capture': 1,
            'notes': {
                'payment_id': str(payment.id),
                'subscription_id': str(subscription.id)
            }
        })
        payment.order_id = razorpay_order['id']
        payment.save()
        return JsonResponse({
            'order_id': razorpay_order['id'],
            'amount': razorpay_order['amount'],
            'currency': razorpay_order['currency'],
            'payment_id': payment.id,
            'razorpay_key_id': settings.RAZORPAY_KEY_ID,
        })
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def verify_subscription_payment(request):    
    try:        
        data = request.data
        payment_id = data.get('payment_id')
        razorpay_payment_id = data.get('razorpay_payment_id')
        razorpay_order_id = data.get('razorpay_order_id')
        razorpay_signature = data.get('razorpay_signature')
        payment = get_object_or_404(UserSubscriptionPayments, id=payment_id, user=request.user)
        params_dict = {
            'razorpay_payment_id': razorpay_payment_id,
            'razorpay_order_id': razorpay_order_id,
            'razorpay_signature': razorpay_signature
        }
        try:
            client.utility.verify_payment_signature(params_dict)
            payment.payment_id = razorpay_payment_id
            payment.signature = razorpay_signature
            payment.status = 'paid'
            payment.save()
            # Deactivate existing active subscription
            UserSubscription.objects.filter(user=request.user, active=True).update(active=False)
            # Activate subscription
            subscription = payment.subscription
            subscription.active = True
            subscription.start_date = timezone.now()
            subscription.end_date = timezone.now() + timedelta(days=30)
            subscription.save()
            # send_payment_receipt_email_async(payment)  # Uncomment when implemented
            return JsonResponse({'status': 'success', 'message': 'Payment verified. You will receive an email with your plan and receipt shortly.'})
        except Exception:
            payment.status = 'failed'
            payment.save()
            return JsonResponse({'error': 'Payment verification failed'}, status=400)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=400)

@csrf_exempt
def subscription_webhook(request):
    if request.method == 'POST':
        try:
            webhook_data = json.loads(request.body)
            webhook_signature = request.headers.get('X-Razorpay-Signature')
            client.utility.verify_webhook_signature(
                request.body.decode('utf-8'),
                webhook_signature,
                settings.RAZORPAY_WEBHOOK_SECRET
            )
            event_type = webhook_data.get('event')
            if event_type in ['payment.authorized', 'payment.failed', 'payment.captured', 'refund.processed']:
                payment_id = webhook_data['payload']['payment']['entity']['notes']['payment_id']
                payment = get_object_or_404(UserSubscriptionPayments, id=payment_id)
                if event_type == 'payment.authorized':
                    payment.status = 'authorized'
                elif event_type == 'payment.failed':
                    payment.status = 'failed'
                elif event_type == 'payment.captured':
                    payment.status = 'paid'
                elif event_type == 'refund.processed':
                    payment.status = 'refunded'
                payment.save()
            return JsonResponse({'status': 'success'})
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
    return JsonResponse({'error': 'Invalid request method'}, status=405)
