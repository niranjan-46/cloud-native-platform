import { redirect } from "next/navigation";

export const metadata = {
  title: "Contact Us | HireLink",
  description: "Redirecting to the HireLink contact page.",
};

export default function ContactUsRedirectPage() {
  redirect("/contact");
}
