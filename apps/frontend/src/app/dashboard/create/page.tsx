// src/app/dashboard/create/page.tsx
"use client";

import React, { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { toast } from "sonner";
import {
  completeVideoFormSchema,
  type CompleteVideoForm,
} from "@/lib/zod/create-video";

// Import step components
import { ConceptStep } from "@/components/create/ConceptStep";
import { StoryboardStep } from "@/components/create/StoryboardStep";
import { SettingsStep } from "@/components/create/SettingsStep";
import { BreakdownStep } from "@/components/create/BreakdownStep";
import { useSidebar } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { api } from "@/trpc/react";

const STEPS = ["CONCEPT", "STORYBOARD", "SETTINGS & CAST", "BREAKDOWN"];

export default function CreatePage() {
  const [currentStep, setCurrentStep] = useState(0);

  const { open } = useSidebar();
  const isMobile = useIsMobile();

  // One comprehensive form for all steps
  const form = useForm<CompleteVideoForm>({
    resolver: zodResolver(completeVideoFormSchema),
    defaultValues: {
      concept: {
        option: "ai",
        content: "",
        format: "custom",
        customFormat: "",
        genre: "",
        tone: "",
        voiceActor: "",
        commercialTargetAudience: "",
        commercialMessage: "",
        commercialBrand: "",
        commercialCallToAction: "",
      },
      storyboard: {
        variants: [],
        selectedVariantId: "",
        customContent: "",
      },
      settings: {
        projectName: "",
        videoModel: "standard",
        aspectRatio: "16:9",
        videoStyle: "none",
        cinematicInspiration: "",
        characters: [],
      },
      breakdown: {
        scenes: [],
        musicDescription: "",
      },
      // Project metadata
      projectId: "",
      projectName: "",
    },
  });

  const createProjectMutation = api.video.create.useMutation({
    onSuccess: (data) => {
      // Update the form with the response data
      form.setValue("projectId", data.projectId);
      form.setValue("storyboard.variants", data.storyboardVariants);

      setCurrentStep(1);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create project");
    },
  });

  const handleNextStep = async () => {
    if (currentStep === 0) {
      // Validate concept step and submit
      const isValid = await form.trigger("concept");
      if (isValid) {
        const conceptData = form.getValues("concept");
        createProjectMutation.mutate(conceptData);
      }
    } else if (currentStep === 1) {
      // Validate storyboard step
      const isValid = await form.trigger("storyboard");
      if (isValid) {
        setCurrentStep(2);
      }
    } else if (currentStep === 2) {
      // Validate settings step
      const isValid = await form.trigger("settings");
      if (isValid) {
        setCurrentStep(3);
      }
    } else {
      // Final step - generate video
      const isValid = await form.trigger();
      if (isValid) {
        const allData = form.getValues();
        console.log("Final form data:", allData);
        // TODO: Call final video generation API
        toast.success("Video generation started!");
      }
    }
  };

  const onSubmit = async (data: CompleteVideoForm) => {
    console.log("Final form data:", data);
    // TODO: Call final video generation API
    toast.success("Video generation started!");
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <ConceptStep form={form} />;
      case 1:
        return <StoryboardStep form={form} />;
      case 2:
        return <SettingsStep form={form} />;
      case 3:
        return <BreakdownStep form={form} />;
      default:
        return <ConceptStep form={form} />;
    }
  };

  const isGenerating = createProjectMutation.isPending;

  return (
    <div className="flex flex-col">
      {/* Sticky Header */}
      <div className="bg-background sticky top-16 z-20 border-b">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-center">
            <div className="flex items-center">
              {STEPS.map((step, index) => (
                <React.Fragment key={step}>
                  <div
                    className={`relative py-2 md:py-3 ${
                      index === currentStep
                        ? "text-primary font-medium"
                        : "text-muted-foreground"
                    }`}
                  >
                    <span className="text-xs">{step}</span>
                  </div>
                  {index < STEPS.length - 1 && (
                    <ChevronRight className="mx-1 h-3 w-3 flex-shrink-0 text-green-500 md:mx-3 md:h-4 md:w-4" />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col">
        <div
          className="relative z-10 container mx-auto max-w-4xl px-4 py-8"
          style={{
            minHeight: "calc(100vh - 140px)", // 100vh - header height - footer height
            paddingBottom: "calc(2rem + 60px)", // Extra padding to account for footer
          }}
        >
          <Form {...form}>
            <form className="space-y-8">{renderStep()}</form>
          </Form>
        </div>

        {/* Sticky Footer */}
        <div
          className={`bg-background/95 fixed right-0 bottom-0 left-0 z-40 h-[60px] border-t shadow-md backdrop-blur-sm transition-all duration-300 ${
            !isMobile && open && "left-64"
          }`}
        >
          <div className="mx-auto h-full px-4 py-3">
            <div className="flex h-full items-center justify-end gap-4">
              {/* add back button */}
              {currentStep > 0 && !isGenerating && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setCurrentStep((prev) => Math.max(prev - 1, 0))
                  }
                >
                  Back
                </Button>
              )}

              <Button
                type="button"
                className="bg-primary hover:bg-primary/90 px-6"
                disabled={isGenerating}
                onClick={async () => {
                  if (currentStep < STEPS.length - 1) {
                    void handleNextStep();
                  } else {
                    // Final submit
                    void form.handleSubmit(onSubmit)();
                  }
                }}
              >
                {currentStep < STEPS.length - 1 ? (
                  <>
                    {isGenerating && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Next <ChevronRight className="ml-1 h-4 w-4" />
                  </>
                ) : (
                  "Submit"
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
