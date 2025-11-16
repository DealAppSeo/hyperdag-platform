import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ThumbsUp, ThumbsDown, Users, Award, Calendar, DollarSign } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { ThumbsUpWithPurposeHub } from "@/components/common/ThumbsUpWithPurposeHub";

// Status badge component with appropriate colors
function StatusBadge({ status }: { status: string }) {
  let color = "";
  switch (status) {
    case "draft":
      color = "bg-gray-500";
      break;
    case "published":
      color = "bg-blue-500";
      break;
    case "funded":
      color = "bg-green-500";
      break;
    case "completed":
      color = "bg-purple-500";
      break;
    case "cancelled":
      color = "bg-red-500";
      break;
    default:
      color = "bg-gray-500";
  }
  
  return (
    <Badge className={`${color} text-white`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  );
}

// RFP card component to display each RFP
interface RfpCardProps {
  rfp: any;
  onVote: (id: number, voteType: string) => void;
  onDonate: (id: number) => void;
  onPropose: (id: number) => void;
}

function RfpCard({ rfp, onVote, onDonate, onPropose }: RfpCardProps) {
  const deadline = rfp.deadline ? new Date(rfp.deadline) : null;
  const isExpired = deadline ? deadline < new Date() : false;
  
  return (
    <Card className="mb-4">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{rfp.title}</CardTitle>
            <CardDescription>Submitted by: {rfp.submitter?.username || "Anonymous"}</CardDescription>
          </div>
          <div className="flex space-x-2">
            <StatusBadge status={rfp.status} />
            {isExpired && <Badge variant="outline" className="bg-red-100 text-red-800">Expired</Badge>}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-700 whitespace-pre-line">
          {rfp.description.length > 200 
            ? `${rfp.description.substring(0, 200)}...` 
            : rfp.description}
        </p>
        
        <div className="flex flex-wrap gap-2 mt-3">
          {rfp.tags && rfp.tags.split(',').map((tag: string, i: number) => (
            <Badge key={i} variant="outline" className="bg-gray-100">{tag.trim()}</Badge>
          ))}
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-center">
          <div>
            <div className="font-semibold text-xl">{rfp.totalFunded || 0}/{rfp.fundingGoal || 0}</div>
            <div className="text-xs text-gray-500">Funding Progress</div>
          </div>
          <div>
            <div className="font-semibold text-xl">{rfp.totalStaked || 0}</div>
            <div className="text-xs text-gray-500">Tokens Staked</div>
          </div>
          <div>
            <div className="font-semibold text-xl">{rfp.proposalCount || 0}</div>
            <div className="text-xs text-gray-500">Proposals</div>
          </div>
          <div>
            <div className="font-semibold text-xl">
              {deadline ? format(deadline, "MMM d, yyyy") : "N/A"}
            </div>
            <div className="text-xs text-gray-500">Deadline</div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="flex space-x-2">
          <ThumbsUpWithPurposeHub
            item={{
              id: rfp.id,
              title: rfp.title,
              description: rfp.description,
              category: rfp.tags?.split(',')[0]?.trim()
            }}
            sourceType="rfp"
            onThumbsUp={() => onVote(rfp.id, "upvote")}
            size="sm"
          />
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onVote(rfp.id, "downvote")}
            className="flex items-center"
          >
            <ThumbsDown className="mr-1 h-4 w-4" />
            {rfp.downvotes || 0}
          </Button>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onDonate(rfp.id)}
            className="flex items-center"
            disabled={isExpired || rfp.status !== 'published'}
          >
            <DollarSign className="mr-1 h-4 w-4" />
            Donate
          </Button>
          <Button 
            variant="default" 
            size="sm" 
            onClick={() => onPropose(rfp.id)}
            className="flex items-center"
            disabled={isExpired || rfp.status !== 'published'}
          >
            <Award className="mr-1 h-4 w-4" />
            Submit Proposal
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}

interface RfpListProps {
  onVote: (id: number, voteType: string) => void;
  onDonate: (id: number) => void;
  onPropose: (id: number) => void;
}

export default function RfpList({ onVote, onDonate, onPropose }: RfpListProps) {
  const { data: rfps, isLoading, error } = useQuery({
    queryKey: ["/api/grant-flow/rfps"],
    queryFn: async () => {
      const res = await fetch("/api/grant-flow/rfps");
      if (!res.ok) throw new Error("Failed to fetch RFPs");
      return res.json();
    },
  });
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-4 w-1/4 mt-2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </CardContent>
            <CardFooter>
              <Skeleton className="h-8 w-full" />
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="text-center py-12 rounded-lg border border-dashed">
        <h3 className="text-lg font-medium text-red-600">Error Loading RFPs</h3>
        <p className="text-gray-500 mt-1">
          {error instanceof Error ? error.message : "Failed to load RFPs"}
        </p>
      </div>
    );
  }
  
  if (!rfps || rfps.length === 0) {
    return (
      <div className="text-center py-12 rounded-lg border border-dashed">
        <h3 className="text-lg font-medium">No RFPs Available</h3>
        <p className="text-gray-500 mt-1">
          There are currently no Requests for Proposals in the system.
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {rfps.map((rfp: any) => (
        <RfpCard 
          key={rfp.id} 
          rfp={rfp} 
          onVote={onVote} 
          onDonate={onDonate}
          onPropose={onPropose} 
        />
      ))}
    </div>
  );
}
