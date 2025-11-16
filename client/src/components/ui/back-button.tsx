import { Link } from 'wouter';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BackButtonProps {
  href: string;
  children?: React.ReactNode;
}

export function BackButton({ href, children = 'Back' }: BackButtonProps) {
  return (
    <Button 
      variant="outline" 
      size="sm" 
      asChild
      className="gap-1 font-normal"
    >
      <Link href={href}>
        <ChevronLeft className="h-4 w-4" />
        {children}
      </Link>
    </Button>
  );
}