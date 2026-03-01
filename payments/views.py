import razorpay
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
import json
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from .models import Payment
from jobs.models import Bid, JobPost
from rest_framework import status
from django.shortcuts import get_object_or_404
from jobs.utils import generate_agreement_pdf
from .utils import send_payment_receipt_email_async
from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .serializers import PaymentSerializer
from subscriptions.models import UserSubscriptionPayments
from subscriptions.serializers import UserSubscriptionPaymentsSerializer

client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_order(request):
    try:
        if not settings.RAZORPAY_KEY_ID or not settings.RAZORPAY_KEY_SECRET:
            return JsonResponse({'error': 'Razorpay is not configured on server'}, status=500)

        data = json.loads(request.body)
        bid_id = data.get('bid_id')
        
        # Get the bid and verify it exists
        bid = get_object_or_404(Bid, id=bid_id)
            
            
        bids_with_successful_payments = Bid.objects.filter(
            job=bid.job
        ).prefetch_related('payment_set').distinct()

        # Filter bids that have successful payments
        successful_bids = []
        for bid in bids_with_successful_payments:
            payments = bid.payment_set.filter(status__in=['paid', 'authorized'])
            if payments.exists():
                successful_bids.append({
                    'bid_id': bid.id,
                    'payment': {
                        'status': payments.first().status,
                        'amount': payments.first().amount,
                        'currency': payments.first().currency,
                        'order_id': payments.first().order_id,
                        'payment_id': payments.first().payment_id,
                        'signature': payments.first().signature
                    }
                })
        if successful_bids:
            # Generate agreement PDF and get URL
            agreement_url = generate_agreement_pdf(bid_id)
            
            # Update bid status to approved
            bid_instance = Bid.objects.get(id=bid_id)
            bid_instance.status = 'approved'
            bid_instance.save()
            
            return JsonResponse({
                'status': bid_instance.status,
                'message': 'Payment already exists for this job'
            }, status=status.HTTP_200_OK)
        
        # Check if payment already exists for this bid
        if Payment.objects.filter(bid=bid, status__in=['paid', 'authorized']).exists():
            return JsonResponse({
                'error': 'Payment already exists for this bid'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Create payment record
        payment = Payment.objects.create(
            user=request.user,
            bid=Bid.objects.get(id=bid_id),
            amount=float(Bid.objects.get(id=bid_id).job.bid_budget/100*30),
            currency='INR',
            status='created'
        )
        
        # Create Razorpay order
        razorpay_order = client.order.create({
            'amount': int(float(Bid.objects.get(id=bid_id).job.bid_budget/100*30) * 100),  # Convert to paise
            'currency': 'INR',
            'payment_capture': 1,
            'notes': {
                'payment_id': str(payment.id),
                'bid_id': str(Bid.objects.get(id=bid_id).id)
            }
        })
        
        # Update payment with order details
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
        return JsonResponse({
            'error': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def verify_payment(request):
    try:
        data = json.loads(request.body)
        payment_id = data.get('payment_id')
        razorpay_payment_id = data.get('razorpay_payment_id')
        razorpay_order_id = data.get('razorpay_order_id')
        razorpay_signature = data.get('razorpay_signature')
        
        # Get payment record
        payment = get_object_or_404(Payment, id=payment_id, user=request.user)
        
        # Verify signature
        params_dict = {
            'razorpay_payment_id': razorpay_payment_id,
            'razorpay_order_id': razorpay_order_id,
            'razorpay_signature': razorpay_signature
        }
        
        try:
            client.utility.verify_payment_signature(params_dict)
            
            # Update payment record
            payment.payment_id = razorpay_payment_id
            payment.signature = razorpay_signature
            payment.status = 'paid'
            payment.save()
            
            bid = Bid.objects.get(id=payment.bid.id)
            # Generate agreement PDF and get URL
            agreement_url = generate_agreement_pdf(bid.id)
            
            # Refresh bid from database to get updated fields
            bid.refresh_from_db()
            bid.status = 'approved'
            bid.save()
            
            # Send payment receipt email
            send_payment_receipt_email_async(payment)
            
            return JsonResponse({
                'status': 'success',
                'message': 'Payment verified successfully'
            })
            
        except razorpay.errors.SignatureVerificationError:
            payment.status = 'failed'
            payment.save()
            return JsonResponse({
                'error': 'Payment verification failed'
            }, status=status.HTTP_400_BAD_REQUEST)
            
    except Exception as e:
        return JsonResponse({
            'error': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)

@csrf_exempt
def webhook(request):
    if request.method == 'POST':
        try:
            # Get webhook data
            webhook_data = json.loads(request.body)
            webhook_signature = request.headers.get('X-Razorpay-Signature')
            
            # Verify webhook signature
            client.utility.verify_webhook_signature(
                request.body.decode('utf-8'),
                webhook_signature,
                settings.RAZORPAY_WEBHOOK_SECRET
            )
            
            # Handle different webhook events
            event_type = webhook_data.get('event')
            
            if event_type == 'payment.authorized':
                payment_id = webhook_data['payload']['payment']['entity']['notes']['payment_id']
                payment = Payment.objects.get(id=payment_id)
                payment.status = 'authorized'
                payment.save()
                
            elif event_type == 'payment.failed':
                payment_id = webhook_data['payload']['payment']['entity']['notes']['payment_id']
                payment = Payment.objects.get(id=payment_id)
                payment.status = 'failed'
                payment.save()
                
            elif event_type == 'payment.captured':
                payment_id = webhook_data['payload']['payment']['entity']['notes']['payment_id']
                payment = Payment.objects.get(id=payment_id)
                payment.status = 'paid'
                payment.save()
                
            elif event_type == 'refund.processed':
                payment_id = webhook_data['payload']['payment']['entity']['notes']['payment_id']
                payment = Payment.objects.get(id=payment_id)
                payment.status = 'refunded'
                payment.save()
            
            return JsonResponse({'status': 'success'})
            
        except Exception as e:
            return JsonResponse({
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)
    
    return JsonResponse({
        'error': 'Invalid request method'
    }, status=status.HTTP_405_METHOD_NOT_ALLOWED)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_payment_details(request, job_id):
    try:
        job_instance = get_object_or_404(JobPost, id=job_id)
        
        if job_instance.posted_by != request.user:
            return JsonResponse({
                'error': 'You are not authorized to view this payment'
            }, status=status.HTTP_403_FORBIDDEN)

        # Get all bids related to that job where payment status is 'paid' or 'authorized'
        bids_with_successful_payments = Bid.objects.filter(
            job=job_instance
        ).prefetch_related('payment_set').distinct()

        # Filter bids that have successful payments
        successful_bids = []
        for bid in bids_with_successful_payments:
            payments = bid.payment_set.filter(status__in=['paid', 'authorized'])
            if payments.exists():
                successful_bids.append({
                    'bid_id': bid.id,
                    'payment': {
                        'status': payments.first().status,
                        'amount': payments.first().amount,
                        'currency': payments.first().currency,
                        'order_id': payments.first().order_id,
                        'payment_id': payments.first().payment_id,
                        'signature': payments.first().signature
                    }
                })

        if successful_bids:
            return JsonResponse({
                'status': 'success',
                'message': 'Payments found',
                'payments': successful_bids
            })
        else:
            return JsonResponse({
                'error': 'No successful payments found'
            }, status=status.HTTP_404_NOT_FOUND)
        
    except Exception as e:
        return JsonResponse({
            'error': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)

class PaymentViewSet(viewsets.ModelViewSet):
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Payment.objects.filter(user=self.request.user).order_by('-created_at')
    
    def get_subscription_payments(self):
        return UserSubscriptionPayments.objects.filter(user=self.request.user).order_by('-created_at')
    
    def get_subscription_payments_serializer(self):
        return UserSubscriptionPaymentsSerializer(self.get_subscription_payments(), many=True)

    @action(detail=False, methods=['get'])
    def history(self, request):
        payments = self.get_queryset()
        serializer = self.get_serializer(payments, many=True)
        subscription_payments_serializer = self.get_subscription_payments_serializer()
        return Response({
            'payments': serializer.data,
            'subscription_payments': subscription_payments_serializer.data
        })
