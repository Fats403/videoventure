"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Check,
  Crown,
  Zap,
  Star,
  CreditCard,
  Calendar,
  Sparkles,
  ArrowRight,
  X,
  Gift,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface PricingPlan {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  interval: "month" | "year";
  description: string;
  features: string[];
  videoCredits: number;
  isPopular?: boolean;
  isPro?: boolean;
  stripeProductId: string;
  stripePriceId: string;
}

export default function BillingPage() {
  const [billingInterval, setBillingInterval] = useState<"month" | "year">(
    "month",
  );
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan | null>(null);
  const [isUpgradeDialogOpen, setIsUpgradeDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Current user data - in real app this would come from your API
  const currentUser = {
    plan: "starter",
    videoCredits: { used: 17, total: 30 },
    billingCycle: "monthly",
    nextBillingDate: "2024-02-15",
    subscriptionStatus: "active",
  };

  const pricingPlans: PricingPlan[] = [
    {
      id: "starter",
      name: "Starter",
      price: billingInterval === "month" ? 0 : 0,
      interval: billingInterval,
      description: "Perfect for trying out our AI video creation platform",
      videoCredits: 5,
      features: [
        "5 video credits per month",
        "Standard video quality",
        "16:9 aspect ratio only",
        "Basic templates",
        "Community support",
        "Watermarked videos",
      ],
      stripeProductId: "prod_starter",
      stripePriceId:
        billingInterval === "month"
          ? "price_starter_monthly"
          : "price_starter_yearly",
    },
    {
      id: "pro",
      name: "Pro",
      price: billingInterval === "month" ? 29 : 290,
      originalPrice: billingInterval === "year" ? 348 : undefined,
      interval: billingInterval,
      description: "Ideal for content creators and small businesses",
      videoCredits: 50,
      features: [
        "50 video credits per month",
        "HD video quality",
        "All aspect ratios (16:9, 1:1, 9:16)",
        "Premium templates & styles",
        "Priority support",
        "No watermarks",
        "Advanced AI models",
        "Custom characters",
      ],
      isPopular: true,
      stripeProductId: "prod_pro",
      stripePriceId:
        billingInterval === "month" ? "price_pro_monthly" : "price_pro_yearly",
    },
    {
      id: "enterprise",
      name: "Enterprise",
      price: billingInterval === "month" ? 99 : 990,
      originalPrice: billingInterval === "year" ? 1188 : undefined,
      interval: billingInterval,
      description: "For teams and agencies with high-volume needs",
      videoCredits: 200,
      features: [
        "200 video credits per month",
        "4K video quality",
        "All aspect ratios & formats",
        "Unlimited templates & styles",
        "24/7 priority support",
        "White-label options",
        "API access",
        "Team collaboration",
        "Custom integrations",
        "Dedicated account manager",
      ],
      isPro: true,
      stripeProductId: "prod_enterprise",
      stripePriceId:
        billingInterval === "month"
          ? "price_enterprise_monthly"
          : "price_enterprise_yearly",
    },
  ];

  const handlePlanSelect = (plan: PricingPlan) => {
    if (plan.id === "starter" && plan.price === 0) {
      // Handle free plan signup
      console.log("Signing up for free plan");
      return;
    }

    setSelectedPlan(plan);
    setIsUpgradeDialogOpen(true);
  };

  const handleStripeCheckout = async () => {
    if (!selectedPlan) return;

    setIsLoading(true);

    try {
      // In your real app, this would call your API to create a Stripe checkout session
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          priceId: selectedPlan.stripePriceId,
          productId: selectedPlan.stripeProductId,
        }),
      });

      const { url } = (await response.json()) as { url: string };

      // Redirect to Stripe Checkout
      window.location.href = url;
    } catch (error) {
      console.error("Error creating checkout session:", error);
      // Handle error - show toast notification
    } finally {
      setIsLoading(false);
    }
  };

  const creditsUsagePercentage =
    (currentUser.videoCredits.used / currentUser.videoCredits.total) * 100;
  const yearlyDiscount = Math.round(((348 - 290) / 348) * 100); // Example calculation

  return (
    <div className="space-y-8 p-4 md:p-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">Choose Your Plan</h1>
        <p className="text-muted-foreground mx-auto max-w-2xl text-xl">
          Unlock the full potential of AI video creation with our flexible
          pricing plans
        </p>
      </div>

      {/* Current Plan Status */}
      <Card className="border-primary/20 bg-primary/5 border-2 p-0">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="text-center md:text-left">
              <h3 className="mb-2 text-lg font-semibold">Current Plan</h3>
              <div className="flex items-center justify-center gap-2 md:justify-start">
                <Badge variant="secondary" className="gap-1">
                  <Zap className="h-3 w-3" />
                  {currentUser.plan.charAt(0).toUpperCase() +
                    currentUser.plan.slice(1)}
                </Badge>
                <span className="text-muted-foreground text-sm">
                  {currentUser.billingCycle}
                </span>
              </div>
            </div>

            <div className="text-center">
              <h3 className="mb-2 text-lg font-semibold">Video Credits</h3>
              <div className="space-y-2">
                <div className="text-2xl font-bold">
                  {currentUser.videoCredits.used}/
                  {currentUser.videoCredits.total}
                </div>
                <Progress value={creditsUsagePercentage} className="h-2" />
                <p className="text-muted-foreground text-sm">
                  {currentUser.videoCredits.total -
                    currentUser.videoCredits.used}{" "}
                  remaining
                </p>
              </div>
            </div>

            <div className="text-center md:text-right">
              <h3 className="mb-2 text-lg font-semibold">Next Billing</h3>
              <div className="flex items-center justify-center gap-2 md:justify-end">
                <Calendar className="text-muted-foreground h-4 w-4" />
                <span>
                  {new Date(currentUser.nextBillingDate).toLocaleDateString()}
                </span>
              </div>
              <p className="text-muted-foreground mt-1 text-sm">
                Auto-renewal {currentUser.subscriptionStatus}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Billing Toggle */}
      <div className="flex justify-center">
        <div className="bg-muted flex items-center gap-1 rounded-lg p-1">
          <Button
            variant={billingInterval === "month" ? "default" : "ghost"}
            size="sm"
            onClick={() => setBillingInterval("month")}
            className="rounded-md"
          >
            Monthly
          </Button>
          <Button
            variant={billingInterval === "year" ? "default" : "ghost"}
            size="sm"
            onClick={() => setBillingInterval("year")}
            className="gap-2 rounded-md"
          >
            Yearly
            <Badge variant="secondary" className="text-xs">
              Save {yearlyDiscount}%
            </Badge>
          </Button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 pt-6 md:grid-cols-3">
        {pricingPlans.map((plan, index) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <PricingCard
              plan={plan}
              isCurrentPlan={currentUser.plan === plan.id}
              onSelect={() => handlePlanSelect(plan)}
            />
          </motion.div>
        ))}
      </div>

      {/* Features Comparison */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="text-center text-2xl">
            Feature Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="p-4 text-left">Features</th>
                  <th className="p-4 text-center">Starter</th>
                  <th className="p-4 text-center">Pro</th>
                  <th className="p-4 text-center">Enterprise</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                <FeatureRow
                  feature="Video Credits"
                  starter="5/month"
                  pro="50/month"
                  enterprise="200/month"
                />
                <FeatureRow
                  feature="Video Quality"
                  starter="Standard"
                  pro="HD"
                  enterprise="4K"
                />
                <FeatureRow
                  feature="Aspect Ratios"
                  starter="16:9 only"
                  pro="All ratios"
                  enterprise="All ratios"
                />
                <FeatureRow
                  feature="Watermarks"
                  starter={false}
                  pro={true}
                  enterprise={true}
                />
                <FeatureRow
                  feature="Premium Templates"
                  starter={false}
                  pro={true}
                  enterprise={true}
                />
                <FeatureRow
                  feature="API Access"
                  starter={false}
                  pro={false}
                  enterprise={true}
                />
                <FeatureRow
                  feature="Team Collaboration"
                  starter={false}
                  pro={false}
                  enterprise={true}
                />
                <FeatureRow
                  feature="Priority Support"
                  starter={false}
                  pro={true}
                  enterprise={true}
                />
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* FAQ Section */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="text-center text-2xl">
            Frequently Asked Questions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <FAQItem
              question="What happens if I exceed my video credits?"
              answer="You can purchase additional credits or upgrade to a higher plan. Your account won't be suspended, but you'll need more credits to create new videos."
            />
            <FAQItem
              question="Can I change my plan anytime?"
              answer="Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately for upgrades, or at the next billing cycle for downgrades."
            />
            <FAQItem
              question="Do you offer refunds?"
              answer="We offer a 30-day money-back guarantee for all paid plans. If you're not satisfied, contact our support team for a full refund."
            />
            <FAQItem
              question="What payment methods do you accept?"
              answer="We accept all major credit cards, PayPal, and bank transfers through our secure Stripe payment processing."
            />
          </div>
        </CardContent>
      </Card>

      {/* Upgrade Dialog */}
      <Dialog open={isUpgradeDialogOpen} onOpenChange={setIsUpgradeDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="text-primary h-5 w-5" />
              Upgrade to {selectedPlan?.name}
            </DialogTitle>
            <DialogDescription>
              You&apos;re about to upgrade to the {selectedPlan?.name} plan.
              You&apos;ll be redirected to Stripe to complete your purchase.
            </DialogDescription>
          </DialogHeader>

          {selectedPlan && (
            <div className="space-y-4">
              <div className="bg-muted rounded-lg p-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-medium">{selectedPlan.name} Plan</span>
                  <span className="text-2xl font-bold">
                    ${selectedPlan.price}
                    <span className="text-muted-foreground text-sm">
                      /{selectedPlan.interval}
                    </span>
                  </span>
                </div>
                {selectedPlan.originalPrice && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-sm line-through">
                      ${selectedPlan.originalPrice}/{selectedPlan.interval}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      Save ${selectedPlan.originalPrice - selectedPlan.price}
                    </Badge>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">What you&apos;ll get:</h4>
                <ul className="space-y-1 text-sm">
                  {selectedPlan.features.slice(0, 4).map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsUpgradeDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleStripeCheckout}
              disabled={isLoading}
              className="gap-2"
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4" />
                  Continue to Payment
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PricingCard({
  plan,
  isCurrentPlan,
  onSelect,
}: {
  plan: PricingPlan;
  isCurrentPlan: boolean;
  onSelect: () => void;
}) {
  return (
    <Card
      className={cn(
        "relative border-2 transition-all duration-200 hover:shadow-lg",
        plan.isPopular && "border-primary/50 scale-105 shadow-lg",
        plan.isPro &&
          "border-purple-500/50 bg-gradient-to-b from-purple-50/50 to-transparent dark:from-purple-950/20",
        isCurrentPlan &&
          "border-green-500/50 bg-green-50/50 dark:bg-green-950/20",
      )}
    >
      {plan.isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 transform">
          <Badge className="bg-primary text-primary-foreground gap-1">
            <Star className="h-3 w-3" />
            Most Popular
          </Badge>
        </div>
      )}

      {plan.isPro && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 transform">
          <Badge className="gap-1 bg-purple-600 text-white">
            <Crown className="h-3 w-3" />
            Enterprise
          </Badge>
        </div>
      )}

      {isCurrentPlan && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 transform">
          <Badge className="gap-1 bg-green-600 text-white">
            <Check className="h-3 w-3" />
            Current Plan
          </Badge>
        </div>
      )}

      <CardHeader className="pb-4 text-center">
        <CardTitle className="text-2xl">{plan.name}</CardTitle>
        <div className="space-y-2">
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-4xl font-bold">${plan.price}</span>
            <span className="text-muted-foreground">/{plan.interval}</span>
          </div>
          {plan.originalPrice && (
            <div className="flex items-center justify-center gap-2">
              <span className="text-muted-foreground text-sm line-through">
                ${plan.originalPrice}/{plan.interval}
              </span>
              <Badge variant="secondary" className="text-xs">
                Save ${plan.originalPrice - plan.price}
              </Badge>
            </div>
          )}
        </div>
        <p className="text-muted-foreground text-sm">{plan.description}</p>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="text-center">
          <div className="text-primary text-3xl font-bold">
            {plan.videoCredits}
          </div>
          <div className="text-muted-foreground text-sm">
            video credits per month
          </div>
        </div>

        <ul className="space-y-3">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2 text-sm">
              <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        <Button
          onClick={onSelect}
          disabled={isCurrentPlan}
          className={cn(
            "w-full gap-2",
            plan.isPopular && "bg-primary hover:bg-primary/90",
            plan.isPro && "bg-purple-600 hover:bg-purple-700",
            isCurrentPlan && "bg-green-600 hover:bg-green-700",
          )}
        >
          {isCurrentPlan ? (
            <>
              <Check className="h-4 w-4" />
              Current Plan
            </>
          ) : plan.price === 0 ? (
            <>
              <Gift className="h-4 w-4" />
              Get Started Free
            </>
          ) : (
            <>
              <ArrowRight className="h-4 w-4" />
              Upgrade Now
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

function FeatureRow({
  feature,
  starter,
  pro,
  enterprise,
}: {
  feature: string;
  starter: string | boolean;
  pro: string | boolean;
  enterprise: string | boolean;
}) {
  const renderCell = (value: string | boolean) => {
    if (typeof value === "boolean") {
      return value ? (
        <Check className="mx-auto h-4 w-4 text-green-500" />
      ) : (
        <X className="mx-auto h-4 w-4 text-red-500" />
      );
    }
    return <span className="text-center">{value}</span>;
  };

  return (
    <tr className="border-b">
      <td className="p-4 font-medium">{feature}</td>
      <td className="p-4 text-center">{renderCell(starter)}</td>
      <td className="p-4 text-center">{renderCell(pro)}</td>
      <td className="p-4 text-center">{renderCell(enterprise)}</td>
    </tr>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="space-y-2">
      <h4 className="font-medium">{question}</h4>
      <p className="text-muted-foreground text-sm leading-relaxed">{answer}</p>
    </div>
  );
}
