import React from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Wallet,
  Mail,
  Shield,
  Loader2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { formatDistanceToNow } from 'date-fns';

interface ReferralTableProps {
  className?: string;
}

export function ReferralTable({ className }: ReferralTableProps) {
  // Fetch referral statistics
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/referral/stats'],
  });

  if (isLoading) {
    return (
      <div className={`flex justify-center items-center py-12 ${className}`}>
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading referrals...</span>
      </div>
    );
  }

  if (error || !data?.success) {
    return (
      <div className={`flex justify-center items-center py-12 text-destructive ${className}`}>
        <AlertCircle className="h-5 w-5 mr-2" />
        <span>Could not load referral data. Please try again later.</span>
      </div>
    );
  }

  const referrals = data.data.referrals || [];

  if (referrals.length === 0) {
    return (
      <div className={`text-center py-12 text-muted-foreground ${className}`}>
        <p>You haven't referred anyone yet.</p>
        <p className="text-sm mt-2">Share your referral code to start growing your network!</p>
      </div>
    );
  }

  // Helper function to render status badge
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="outline" className="flex items-center gap-1 bg-yellow-50 text-yellow-700 border-yellow-200">
            <Clock className="h-3 w-3" />
            <span>Pending</span>
          </Badge>
        );
      case 'recorded':
        return (
          <Badge variant="outline" className="flex items-center gap-1 bg-blue-50 text-blue-700 border-blue-200">
            <Clock className="h-3 w-3" />
            <span>In Progress</span>
          </Badge>
        );
      case 'verified':
        return (
          <Badge variant="outline" className="flex items-center gap-1 bg-green-50 text-green-700 border-green-200">
            <CheckCircle2 className="h-3 w-3" />
            <span>Verified</span>
          </Badge>
        );
      case 'rewarded':
        return (
          <Badge variant="outline" className="flex items-center gap-1 bg-purple-50 text-purple-700 border-purple-200">
            <CheckCircle2 className="h-3 w-3" />
            <span>Rewarded</span>
          </Badge>
        );
      case 'expired':
        return (
          <Badge variant="outline" className="flex items-center gap-1 bg-red-50 text-red-700 border-red-200">
            <XCircle className="h-3 w-3" />
            <span>Expired</span>
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <span>{status}</span>
          </Badge>
        );
    }
  };

  // Helper function to get initials from username
  const getInitials = (username: string) => {
    return username.substring(0, 2).toUpperCase();
  };

  return (
    <div className={className}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead className="text-right">Verification</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {referrals.map((referral) => (
            <TableRow key={referral.id}>
              <TableCell className="font-medium">
                <div className="flex items-center">
                  <Avatar className="h-8 w-8 mr-2">
                    <AvatarImage src={referral.refereeAvatar} alt={referral.refereeUsername} />
                    <AvatarFallback>{getInitials(referral.refereeUsername)}</AvatarFallback>
                  </Avatar>
                  {referral.refereeUsername}
                </div>
              </TableCell>
              <TableCell>{renderStatusBadge(referral.status)}</TableCell>
              <TableCell>
                {formatDistanceToNow(new Date(referral.joinedAt), { addSuffix: true })}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end space-x-1">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        {referral.hasWallet ? (
                          <Wallet className="h-4 w-4 text-green-500" />
                        ) : (
                          <Wallet className="h-4 w-4 text-gray-300" />
                        )}
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{referral.hasWallet ? 'Wallet connected' : 'No wallet connected'}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        {referral.hasVerifiedEmail ? (
                          <Mail className="h-4 w-4 text-green-500" />
                        ) : (
                          <Mail className="h-4 w-4 text-gray-300" />
                        )}
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{referral.hasVerifiedEmail ? 'Email verified' : 'Email not verified'}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        {referral.has2fa ? (
                          <Shield className="h-4 w-4 text-green-500" />
                        ) : (
                          <Shield className="h-4 w-4 text-gray-300" />
                        )}
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{referral.has2fa ? '2FA enabled' : '2FA not enabled'}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}