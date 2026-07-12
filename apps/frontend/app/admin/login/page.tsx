import { AdminLoginForm } from '@/components/admin-login-form';

export default function AdminLoginPage() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-sm flex-col justify-center px-4">
      <h1 className="text-xl font-bold">관리자 로그인</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        예약 신청 내역을 확인하려면 비밀번호를 입력하세요.
      </p>
      <AdminLoginForm />
    </div>
  );
}
