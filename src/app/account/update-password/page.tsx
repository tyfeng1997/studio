// app/account/update-password/page.tsx
import { UpdatePasswordForm } from "@/app/auth/components/UpdatePasswordForm";

export default function UpdatePasswordPage() {
  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gray-50">
      <UpdatePasswordForm />
    </div>
  );
}
