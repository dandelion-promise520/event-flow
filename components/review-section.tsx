"use client";

import { useEffect, useState, useCallback } from "react";
import { Star, MessageSquare, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field";
import { cn } from "@/lib/utils";

interface Review {
  id: string;
  rating: number;
  content: string;
  createdAt: string;
  user: {
    name: string;
    email: string;
  };
}

interface ReviewSectionProps {
  eventId: string;
}

export default function ReviewSection({ eventId }: ReviewSectionProps) {
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [content, setContent] = useState("");
  const [canReview, setCanReview] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const fetchReviews = useCallback(async () => {
    try {
      const res = await fetch(`/api/events/${eventId}/reviews`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setReviews(data);
      }
    } catch (err) {
      console.error(err);
    }
  }, [eventId]);

  const checkReviewEligibility = useCallback(async (userId: string) => {
    try {
      // 校验是否有已使用的门票
      const res = await fetch(`/api/tickets?userId=${userId}&eventId=${eventId}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        const hasUsed = data.some((t) => t.status === "USED");
        if (hasUsed) {
          // 再检查是否已经发表过评论
          const reviewRes = await fetch(`/api/events/${eventId}/reviews`);
          const reviewsData = await reviewRes.json();
          const alreadyReviewed = reviewsData.some((r: Review & { userId: string }) => r.userId === userId);
          setCanReview(!alreadyReviewed);
        }
      }
    } catch (err) {
      console.error(err);
    }
  }, [eventId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchReviews();
      const stored = localStorage.getItem("campus_user");
      if (stored) {
        const u = JSON.parse(stored);
        setUser(u);
        checkReviewEligibility(u.id);
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [eventId, fetchReviews, checkReviewEligibility]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await fetch(`/api/events/${eventId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, rating, content }),
      });
      const data = await res.json();

      if (data.success) {
        setSuccessMsg("评价提交成功！");
        setContent("");
        setCanReview(false);
        fetchReviews();
      } else {
        setErrorMsg(data.message || "提交评价失败");
      }
    } catch {
      setErrorMsg("服务器连接失败");
    }
  };

  const avgRating = reviews.length > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <div className="flex flex-col gap-6 mt-8 pt-8 border-t">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <MessageSquare className="size-5 text-primary" /> 活动评价 ({reviews.length})
        </h3>
        {avgRating && (
          <Badge variant="secondary" className="gap-1 bg-amber-50 text-amber-700 hover:bg-amber-50/80 dark:bg-amber-950/20 dark:text-amber-400 border-transparent font-medium">
            <Star data-icon="inline-start" className="fill-amber-500 stroke-amber-500" />
            平均分 {avgRating}
          </Badge>
        )}
      </div>

      {/* 提交评价区域 */}
      {canReview && (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 bg-muted/30 p-4 rounded-lg border">
          <div className="font-medium text-sm text-foreground">写下您的活动评价 (仅限参与者)</div>
          
          <FieldGroup>
            <Field>
              <FieldLabel className="text-xs text-muted-foreground">星级评分</FieldLabel>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      className={cn(
                        "size-5",
                        star <= (hoverRating || rating)
                          ? "fill-amber-400 stroke-amber-400"
                          : "text-muted-foreground/30"
                      )}
                    />
                  </button>
                ))}
              </div>
            </Field>

            <Field>
              <FieldLabel className="sr-only">评价内容</FieldLabel>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="请分享您对本次活动的真实看法，例如内容含金量、现场秩序等..."
                required
                className="bg-background"
              />
            </Field>
          </FieldGroup>

          {errorMsg && <p className="text-xs text-destructive">{errorMsg}</p>}
          {successMsg && <p className="text-xs text-emerald-600 dark:text-emerald-400">{successMsg}</p>}

          <div className="text-right">
            <Button type="submit" size="sm">提交评价</Button>
          </div>
        </form>
      )}

      {/* 评价列表展示 */}
      <div className="flex flex-col gap-4">
        {reviews.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">暂无评价，欢迎参与活动后留言评价！</p>
        ) : (
          reviews.map((r) => (
            <div key={r.id} className="p-4 border rounded-lg flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-2 animate-none">
                  <span className="font-semibold text-foreground">{r.user?.name || "匿名用户"}</span>
                  <Badge variant="secondary" className="scale-90 font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border-transparent inline-flex items-center gap-1">
                    <Check data-icon="inline-start" className="shrink-0" /> 已核销用户
                  </Badge>
                </div>
                <span>{new Date(r.createdAt).toLocaleString()}</span>
              </div>
              
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={cn(
                      "size-3.5",
                      star <= r.rating ? "fill-amber-400 stroke-amber-400" : "text-muted-foreground/20"
                    )}
                  />
                ))}
              </div>

              <p className="text-sm text-foreground/90 whitespace-pre-wrap">{r.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
