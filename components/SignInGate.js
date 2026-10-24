// MZAZI TECH — the sign-in wall, shown in place of private data.
//
// Every page on this site is readable without an account. What an account buys
// is the data and the buttons: your devices, your balance, your subscription.
// So instead of bouncing a visitor to /login the moment they open /devices —
// which also loses the page they asked for — the page renders its header and
// shows this panel where the private part would be.
//
// `next` is carried through to the login form so signing in returns here.

import Link from 'next/link';
import { Card, EmptyState, Button, Icons } from '@/components/ui';
import { authHref } from '@/lib/nextPath';

export default function SignInGate({
  title = 'Sign in to see this',
  description = 'Create a free account to use this page. Everything you see here is public — the data behind it is yours alone.',
  next = '/',
  icon,
}) {
  return (
    <Card className="anim-fade-up">
      <EmptyState
        icon={icon || <Icons.Shield size={26} />}
        title={title}
        description={description}
        action={<Button href={authHref(next)}>Sign in</Button>}
        secondaryAction={
          <Button href={authHref(next, { signup: true })} variant="ghost">
            Create account
          </Button>
        }
      />
      <p style={{ margin: '4px 0 0', textAlign: 'center', fontSize: 13, color: 'var(--dim)' }}>
        <Link className="link" href="/whatsapp-bot">
          Or keep reading about how pairing works
        </Link>
      </p>
    </Card>
  );
}
