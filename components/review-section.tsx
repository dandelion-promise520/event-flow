"use client";

import { useEffect, useState } from "react";
import { Star, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

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

  const fetchReviews = async () => {
    try {
      const res = await fetch(`/api/events/${eventId}/reviews`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setReviews(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const checkReviewEligibility = async (userId: string) => {
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
          const alreadyReviewed = reviewsData.some((r: any) => r.userId === userId);
          setCanReview(!alreadyReviewed);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchReviews();
    const stored = localStorage.getItem("campus_user");
    if (stored) {
      const u = JSON.parse(stored);
      setUser(u);
      checkReviewEligibility(u.id);
    }
  }, [eventId]);

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
    } catch (err) {
      setErrorMsg("服务器连接失败");
    }
  };

  const avgRating = reviews.length > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <div className="space-y-6 mt-8 pt-8 border-t">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" /> 活动评价 ({reviews.length})
        </h3>
        {avgRating && (
          <div className="flex items-center gap-1 text-sm bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full font-medium dark:bg-amber-950/20 dark:text-amber-400">
            <Star className="h-4 w-4 fill-amber-500 stroke-amber-500" />
            平均分 {avgRating}
          </div>
        )}
      </div>

      {/* 提交评价区域 */}
      {canReview && (
        <form onSubmit={handleSubmit} className="bg-muted/30 p-4 rounded-lg border space-y-4">
          <div className="font-medium text-sm text-foreground">写下您的活动评价 (仅限参与者)</div>
          
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground mr-2">星级评分:</span>
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
                  className={`h-5 w-5 ${
                    star <= (hoverRating || rating)
                      ? "fill-amber-400 stroke-amber-400"
                      : "text-muted-foreground/30"
                  }`}
                />
              </button>
            ))}
          </div>

          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="请分享您对本次活动的真实看法，例如内容含金量、现场秩序等..."
            required
            className="bg-background"
          />

          {errorMsg && <p className="text-xs text-red-500">{errorMsg}</p>}
          {successMsg && <p className="text-xs text-green-500">{successMsg}</p>}

          <div className="text-right">
            <Button type="submit" size="sm">提交评价</Button>
          </div>
        </form>
      )}

      {/* 评价列表展示 */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">暂无评价，欢迎参与活动后留言评价！</p>
        ) : (
          reviews.map((r) => (
            <div key={r.id} className="p-4 border rounded-lg space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">{r.user?.name || "匿名用户"}</span>
                  <span className="bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded scale-90 dark:bg-emerald-950/20 dark:text-emerald-400 font-bold">
                    ✓ 已核销用户
                  </span>
                </div>
                <span>{new Date(r.createdAt).toLocaleString()}</span>
              </div>
              
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-3.5 w-3.5 ${
                      star <= r.rating ? "fill-amber-400 stroke-amber-400" : "text-muted-foreground/20"
                    }`}
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
