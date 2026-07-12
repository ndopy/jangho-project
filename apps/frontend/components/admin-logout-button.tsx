import { logoutAdmin } from '@/lib/actions';
import { Button } from '@/components/ui/button';

export function AdminLogoutButton() {
  return (
    <form action={logoutAdmin}>
      <Button type="submit" variant="outline" size="sm">
        로그아웃
      </Button>
    </form>
  );
}
