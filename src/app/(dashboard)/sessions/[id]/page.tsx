import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  Clock,
  CheckCircle2,
  AlertCircle,
  UtensilsCrossed,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redis, sessionKey, TTL } from "@/lib/redis";
import type { SessionWithDetails } from "@/types";
import { VotePanel } from "@/components/VotePanel";
import { AppointmentForm } from "@/components/AppointmentForm";
import { CloseVotingButton } from "@/components/CloseVotingButton";
import { JoinSessionButton } from "@/components/JoinSessionButton";
import { ShareButton } from "@/components/ShareButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  cn,
  formatDate,
  getInitials,
  getStatusColor,
  getStatusLabel,
} from "@/lib/utils";
interface PageProps {
  params: { id: string };
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const mealSession = await db.mealSession.findUnique({
    where: { id: params.id },
  });
  return { title: mealSession?.name ?? "Session" };
}

async function getSessionData(id: string): Promise<SessionWithDetails | null> {
  const key = sessionKey(id)

  // 1. Try Redis cache first
  const cached = await redis.get<SessionWithDetails>(key)
  if (cached) return cached

  // 2. Cache miss — query Postgres
  const mealSession = await db.mealSession.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, name: true, email: true, image: true } },
      members: {
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
        },
      },
      options: {
        include: {
          votes: true,
          _count: { select: { votes: true } },
        },
        orderBy: { votes: { _count: 'desc' } },
      },
      appointment: true,
      _count: { select: { members: true, options: true } },
    },
  })

  if (!mealSession) return null

  // 3. Store in Redis for TTL seconds
  await redis.setex(key, TTL.SESSION, mealSession)

  return mealSession as unknown as SessionWithDetails
}

export default async function SessionDetailPage({ params }: PageProps) {
  const session = await auth();
  const userId = session!.user!.id!;

  const mealSession = await getSessionData(params.id)

  if (!mealSession) notFound();

  const isOwner = mealSession.ownerId === userId;
  const isMember = mealSession.members.some((m) => m.userId === userId);
  const totalVotes = mealSession.options.reduce(
    (sum, o) => sum + o._count.votes,
    0,
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-start gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="mt-0.5 h-9 w-9 shrink-0"
          asChild
        >
          <Link href="/">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold truncate">{mealSession.name}</h1>
            <Badge
              className={cn("border", getStatusColor(mealSession.status))}
              variant="outline"
            >
              {getStatusLabel(mealSession.status)}
            </Badge>
          </div>
          {mealSession.description && (
            <p className="mt-1 text-sm text-muted-foreground">
              {mealSession.description}
            </p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {mealSession.members.length} members
            </span>
            {mealSession.closingAt && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Closes {formatDate(mealSession.closingAt)}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Created {formatDate(mealSession.createdAt)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <ShareButton sessionId={mealSession.id} />
          {isOwner && mealSession.status === "VOTING" && (
            <CloseVotingButton sessionId={mealSession.id} />
          )}
          {!isMember && <JoinSessionButton sessionId={mealSession.id} />}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <UtensilsCrossed className="h-4 w-4 text-orange-500" />
                  Restaurant Options
                </CardTitle>
                <span className="text-xs text-muted-foreground">
                  {totalVotes} total votes
                </span>
              </div>
            </CardHeader>
            <CardContent>
              {isMember ? (
                <VotePanel
                  options={mealSession.options}
                  sessionId={mealSession.id}
                  sessionStatus={mealSession.status}
                  currentUserId={userId}
                />
              ) : (
                <div className="rounded-xl border border-dashed p-8 text-center text-muted-foreground">
                  <p className="text-sm">
                    Join this session to see and vote on options.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {mealSession.appointment && (
            <Card className="border-green-200 bg-green-50/40">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-green-700">
                  <CheckCircle2 className="h-4 w-4" />
                  Appointment Confirmed
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <UtensilsCrossed className="h-4 w-4 text-green-600 shrink-0" />
                  <span className="font-semibold">
                    {mealSession.appointment.restaurantName}
                  </span>
                </div>
                {mealSession.appointment.address && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 shrink-0" />
                    <span>{mealSession.appointment.address}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4 shrink-0" />
                  <span>{formatDate(mealSession.appointment.scheduledAt)}</span>
                </div>
                {mealSession.appointment.notes && (
                  <p className="mt-2 text-sm text-muted-foreground border-t pt-2">
                    {mealSession.appointment.notes}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {isOwner && mealSession.status === "CLOSED" && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-orange-500" />
                  {mealSession.appointment
                    ? "Update Appointment"
                    : "Set Appointment"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AppointmentForm
                  sessionId={mealSession.id}
                  existing={mealSession.appointment}
                />
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                Members ({mealSession.members.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {mealSession.members.map((member) => (
                <div key={member.id} className="flex items-center gap-2.5">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={member.user.image ?? undefined} />
                    <AvatarFallback className="text-xs bg-orange-100 text-orange-700">
                      {getInitials(member.user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate leading-none">
                      {member.user.name ?? "Anonymous"}
                    </p>
                    {member.userId === mealSession.ownerId && (
                      <p className="text-[11px] text-orange-600 mt-0.5">
                        Owner
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {mealSession.status === "VOTING" && !isOwner && isMember && (
            <Card className="border-orange-200 bg-orange-50/40">
              <CardContent className="pt-4">
                <div className="flex gap-2.5">
                  <AlertCircle className="h-4 w-4 text-orange-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-orange-700">
                    Vote for your preferred restaurant. You can change your vote
                    anytime before voting closes.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
