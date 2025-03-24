// app/reset-password/page.tsx
import { ResetPasswordForm } from "@/app/auth/components/ResetPasswordForm";

export default function ResetPasswordPage() {
  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gray-50">
      <ResetPasswordForm />
    </div>
  );
}
