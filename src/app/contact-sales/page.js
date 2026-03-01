import { redirect } from "next/navigation";

export const metadata = {
  title: "Contact Sales | HireLink",
  description: "Redirecting to the HireLink contact page.",
};

export default function ContactSalesRedirectPage() {
  redirect("/contact");
}
