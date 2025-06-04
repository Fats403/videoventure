"use client";

import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Video,
  Sparkles,
  FileText,
  Cpu,
  Check,
  Star,
  Facebook,
  Instagram,
  Github,
  Twitter,
  Linkedin,
  Shield,
  Mail,
  Phone,
  MapPin,
  Terminal,
  Eraser,
  DollarSign,
  Cloud,
  Route,
  HelpCircle,
  Heart,
  Bolt,
} from "lucide-react";
import Navbar from "@/components/landing/navbar";
import Hero from "@/components/landing/hero";
import { cn } from "@/lib/utils";
import VideoShowcase from "@/components/landing/video-showcase";

const Feature = ({
  title,
  description,
  icon,
  index,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  index: number;
}) => {
  return (
    <div
      className={cn(
        "group/feature relative flex flex-col py-10 lg:border-r dark:border-neutral-800",
        (index === 0 || index === 4) && "lg:border-l dark:border-neutral-800",
        index < 4 && "lg:border-b dark:border-neutral-800",
      )}
    >
      {index < 4 && (
        <div className="pointer-events-none absolute inset-0 h-full w-full bg-gradient-to-t from-neutral-100 to-transparent opacity-0 transition duration-200 group-hover/feature:opacity-100 dark:from-neutral-800" />
      )}
      {index >= 4 && (
        <div className="pointer-events-none absolute inset-0 h-full w-full bg-gradient-to-b from-neutral-100 to-transparent opacity-0 transition duration-200 group-hover/feature:opacity-100 dark:from-neutral-800" />
      )}
      <div className="relative z-10 mb-4 px-10 text-neutral-600 dark:text-neutral-400">
        {icon}
      </div>
      <div className="relative z-10 mb-2 px-10 text-lg font-bold">
        <div className="group-hover/feature:bg-primary absolute inset-y-0 left-0 h-6 w-1 origin-center rounded-tr-full rounded-br-full bg-neutral-300 transition-all duration-200 group-hover/feature:h-8 dark:bg-neutral-700" />
        <span className="dark:group-hover/feature:text-primary group-hover/feature:text-primary inline-block text-neutral-800 transition duration-200 group-hover/feature:translate-x-2 dark:text-neutral-100">
          {title}
        </span>
      </div>
      <p className="relative z-10 max-w-xs px-10 text-sm text-neutral-600 dark:text-neutral-300">
        {description}
      </p>
    </div>
  );
};

// Features Component (enhanced)
const Features = () => {
  const features = [
    {
      title: "Built for developers",
      description:
        "Built for engineers, developers, dreamers, thinkers and doers.",
      icon: <Terminal />,
    },
    {
      title: "Ease of use",
      description:
        "It's as easy as using an Apple, and as expensive as buying one.",
      icon: <Eraser />,
    },
    {
      title: "Pricing like no other",
      description:
        "Our prices are best in the market. No cap, no lock, no credit card required.",
      icon: <DollarSign />,
    },
    {
      title: "100% Uptime guarantee",
      description: "We just cannot be taken down by anyone.",
      icon: <Cloud />,
    },
    {
      title: "Multi-tenant Architecture",
      description: "You can simply share passwords instead of buying new seats",
      icon: <Route />,
    },
    {
      title: "24/7 Customer Support",
      description:
        "We are available a 100% of the time. Atleast our AI Agents are.",
      icon: <HelpCircle />,
    },
    {
      title: "Money back guarantee",
      description:
        "If you donot like EveryAI, we will convince you to like us.",
      icon: <Bolt />,
    },
    {
      title: "And everything else",
      description: "I just ran out of copy ideas. Accept my sincere apologies",
      icon: <Heart />,
    },
  ];
  return (
    <section
      id="features"
      className="bg-background relative overflow-hidden px-6 py-20"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-green-900/5 to-transparent" />

      <div className="relative z-10 container mx-auto">
        <div className="mb-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="bg-primary/10 text-primary mb-4 inline-flex items-center space-x-2 rounded-full px-4 py-2"
          >
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-medium">Powerful Features</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-foreground mb-6 text-4xl font-bold md:text-5xl"
          >
            Everything You Need to Create
            <br />
            <span className="text-primary"> Amazing Videos</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-muted-foreground mx-auto max-w-3xl text-lg"
          >
            Our AI-powered platform combines cutting-edge technology with
            intuitive design to deliver professional results without the
            complexity.
          </motion.p>
        </div>

        <div className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 py-10 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <Feature key={feature.title} {...feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
};

// How It Works Component (enhanced)
const HowItWorks = () => {
  const steps = [
    {
      icon: <FileText className="h-8 w-8 text-white" />,
      title: "Describe Your Vision",
      description:
        "Tell us what you want to create. Be as detailed or simple as you like - our AI understands natural language.",
      details: [
        "Natural language processing",
        "Style and tone recognition",
        "Automatic storyboard generation",
      ],
    },
    {
      icon: <Cpu className="h-8 w-8 text-white" />,
      title: "AI Magic Happens",
      description:
        "Our advanced AI processes your input and creates visuals, animations, voiceovers, and music tailored to your needs.",
      details: [
        "Visual generation",
        "Voice synthesis",
        "Music composition",
        "Scene optimization",
      ],
    },
    {
      icon: <Video className="h-8 w-8 text-white" />,
      title: "Download & Share",
      description:
        "Review your video, make any final adjustments, and export in your preferred format ready for any platform.",
      details: [
        "Multiple export formats",
        "Platform optimization",
        "Brand consistency",
        "Quality assurance",
      ],
    },
  ];

  return (
    <section id="how-it-works" className="bg-background px-6 py-20">
      <div className="container mx-auto">
        <div className="mb-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="bg-primary/10 text-primary mb-4 inline-flex items-center space-x-2 rounded-full px-4 py-2"
          >
            <Cpu className="h-4 w-4" />
            <span className="text-sm font-medium">Simple Process</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-foreground mb-6 text-4xl font-bold md:text-5xl"
          >
            From Idea to Video in
            <br />
            <span className="text-primary"> 3 Simple Steps</span>
          </motion.h2>
        </div>

        <div className="mx-auto max-w-6xl">
          <div className="relative grid grid-cols-1 gap-8 lg:grid-cols-3">
            {/* Connection lines */}
            <div className="absolute top-8 right-0 left-0 hidden h-0.5 lg:block">
              <div className="border-primary/30 mx-auto w-2/3 border-t-2 border-dashed"></div>
            </div>

            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="relative"
              >
                <div className="text-center">
                  <div className="border-primary/30 from-primary/20 to-accent/20 relative mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border-2 bg-gradient-to-br">
                    <div className="from-primary to-accent absolute inset-0 animate-pulse rounded-full bg-gradient-to-br"></div>
                    <div className="relative z-10 text-white">{step.icon}</div>
                    <div className="from-primary to-accent absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r text-xs font-bold text-white">
                      {index + 1}
                    </div>
                  </div>

                  <h3 className="text-foreground mb-4 text-xl font-bold">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    {step.description}
                  </p>

                  <div className="space-y-2">
                    {step.details.map((detail, i) => (
                      <div
                        key={i}
                        className="text-primary flex items-center justify-center space-x-2 text-sm"
                      >
                        <Check className="h-3 w-3" />
                        <span>{detail}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

const Pricing = () => {
  const plans = [
    {
      name: "Starter",
      price: "$19",
      description: "Perfect for individuals and small projects",
      features: [
        "5 AI-generated videos per month",
        "720p video quality",
        "Basic editing tools",
        "50+ templates",
        "Email support",
        "Watermark removal",
      ],
      cta: "Start Free Trial",
    },
    {
      name: "Professional",
      price: "$49",
      description: "Ideal for content creators and businesses",
      features: [
        "25 AI-generated videos per month",
        "1080p video quality",
        "Advanced editing suite",
        "500+ premium templates",
        "Priority support",
        "Brand customization",
        "API access",
        "Team collaboration",
      ],
      popular: true,
      cta: "Start Free Trial",
    },
    {
      name: "Enterprise",
      price: "$99",
      description: "For teams and high-volume production",
      features: [
        "Unlimited AI-generated videos",
        "4K video quality",
        "Full editing suite",
        "Custom templates & animations",
        "Dedicated account manager",
        "White-label solution",
        "Advanced analytics",
        "SSO integration",
      ],
      cta: "Contact Sales",
    },
  ];

  return (
    <section
      id="pricing"
      className="bg-background relative overflow-hidden px-6 py-20"
    >
      <div className="from-accent/5 absolute inset-0 bg-gradient-to-b to-transparent" />

      <div className="relative z-10 container mx-auto">
        <div className="mb-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="bg-accent/40 text-primary mb-4 inline-flex items-center space-x-2 rounded-full px-4 py-2"
          >
            <Shield className="h-4 w-4" />
            <span className="text-sm font-medium">Transparent Pricing</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-foreground mb-6 text-4xl font-bold md:text-5xl"
          >
            Choose Your
            <span className="text-primary"> Perfect Plan</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-muted-foreground mx-auto max-w-3xl text-lg"
          >
            Start creating amazing videos today with our flexible pricing
            options. All plans include a 14-day free trial with no credit card
            required.
          </motion.p>
        </div>

        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 md:grid-cols-3">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              className="relative"
            >
              {plan.popular && (
                <div className="absolute -top-8 left-1/2 z-10 -translate-x-1/2 transform">
                  <div className="from-primary to-accent rounded-full bg-gradient-to-r px-4 py-1 text-sm font-medium text-white">
                    Most Popular
                  </div>
                </div>
              )}

              <Card
                className={`bg-card/80 border-border h-full backdrop-blur-sm transition-all duration-300 ${
                  plan.popular
                    ? "border-primary/50 shadow-primary/10 scale-105 shadow-2xl"
                    : "hover:border-accent/50 hover:shadow-accent/5 hover:shadow-xl"
                }`}
              >
                <CardHeader className="pb-8 text-center">
                  <CardTitle className="text-foreground mb-2 text-2xl font-bold">
                    {plan.name}
                  </CardTitle>
                  <div className="mb-4">
                    <span className="text-foreground text-4xl font-bold">
                      {plan.price}
                    </span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  <p className="text-muted-foreground">{plan.description}</p>
                </CardHeader>

                <CardContent className="space-y-4">
                  {plan.features.map((feature, i) => (
                    <div key={i} className="flex items-center space-x-3">
                      <Check className="text-primary h-5 w-5 flex-shrink-0" />
                      <span className="text-muted-foreground">{feature}</span>
                    </div>
                  ))}
                </CardContent>

                <div className="p-6 pt-0">
                  <Button
                    className={`w-full ${
                      plan.popular
                        ? "from-primary to-accent hover:from-primary/90 hover:to-accent/90 bg-gradient-to-r"
                        : "bg-accent hover:bg-accent/90"
                    } text-white`}
                  >
                    {plan.cta}
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-12 text-center"
        >
          <p className="text-muted-foreground mb-4">
            All plans include our 30-day money-back guarantee
          </p>
          <div className="text-muted-foreground flex items-center justify-center space-x-8 text-sm">
            <div className="flex items-center space-x-2">
              <Check className="text-primary h-4 w-4" />
              <span>Cancel anytime</span>
            </div>
            <div className="flex items-center space-x-2">
              <Check className="text-primary h-4 w-4" />
              <span>No setup fees</span>
            </div>
            <div className="flex items-center space-x-2">
              <Check className="text-primary h-4 w-4" />
              <span>24/7 support</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

// FAQ Component
const FAQ = () => {
  const faqs = [
    {
      question: "How does the AI video generation work?",
      answer:
        "Our AI analyzes your text description and automatically generates visuals, animations, voiceovers, and music that match your vision. The process uses advanced machine learning models trained on millions of video elements to create professional-quality content in minutes.",
    },
    {
      question: "What video formats can I export?",
      answer:
        "You can export videos in multiple formats including MP4, MOV, and AVI. We support various resolutions from 720p to 4K, and you can optimize your videos for different platforms like YouTube, Instagram, TikTok, and LinkedIn with platform-specific aspect ratios.",
    },
    {
      question: "Can I customize the generated videos?",
      answer:
        "Absolutely! While our AI creates the initial video, you have full control to edit and customize every element. You can change colors, fonts, music, voiceovers, and add your own branding. Our advanced editor gives you professional-level control while keeping things simple.",
    },
    {
      question: "Is there a limit to video length?",
      answer:
        "Video length limits depend on your plan. Starter plans support videos up to 2 minutes, Professional plans up to 10 minutes, and Enterprise plans have no length restrictions. Most marketing and social media videos perform best under 2 minutes anyway.",
    },
    {
      question: "Do you offer team collaboration features?",
      answer:
        "Yes! Professional and Enterprise plans include team collaboration features. You can share projects, leave comments, assign tasks, and manage brand assets centrally. Enterprise plans also include advanced permission controls and approval workflows.",
    },
    {
      question: "What languages are supported?",
      answer:
        "We support over 50 languages for both text input and AI-generated voiceovers. This includes major languages like English, Spanish, French, German, Mandarin, Japanese, and many others. Subtitles can be automatically generated in multiple languages as well.",
    },
    {
      question: "Is my content secure and private?",
      answer:
        "Your privacy and security are our top priorities. All content is encrypted in transit and at rest. We never share your videos or data with third parties. Enterprise plans include additional security features like SSO integration and advanced access controls.",
    },
    {
      question: "How quickly can I create a video?",
      answer:
        "Most videos are generated within 2-5 minutes, depending on length and complexity. Simple videos can be ready in under a minute, while more complex productions with custom animations might take up to 10 minutes. Our AI works 24/7, so there's no waiting in queues.",
    },
  ];

  return (
    <section id="faq" className="bg-background px-6 py-20">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-16 pb-2 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="bg-primary/10 text-primary mb-4 inline-flex items-center space-x-2 rounded-full px-4 py-2"
          >
            <Star className="h-4 w-4" />
            <span className="text-sm font-medium">Got Questions?</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-foreground mb-6 text-4xl font-bold md:text-5xl"
          >
            Frequently Asked
            <span className="text-primary"> Questions</span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-muted-foreground text-lg"
          >
            Everything you need to know about VideoVenture AI
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Accordion type="single" collapsible className="space-y-4 pb-1">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-card/50 border-border hover:border-primary/50 rounded-lg border px-6 transition-all duration-300"
              >
                <AccordionTrigger className="py-6 text-left hover:no-underline">
                  <span className="text-foreground font-semibold">
                    {faq.question}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-6 leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-12 text-center"
        >
          <p className="text-muted-foreground mb-6">
            Still have questions? We&apos;re here to help!
          </p>
          <Button className="text-white">Contact Support</Button>
        </motion.div>
      </div>
    </section>
  );
};

// Footer Component
const Footer = () => {
  const footerLinks = {
    product: [
      { name: "Features", href: "#features" },
      { name: "How it Works", href: "#how-it-works" },
      { name: "Pricing", href: "#pricing" },
      { name: "API Documentation", href: "#" },
      { name: "Templates", href: "#" },
    ],
    company: [
      { name: "About Us", href: "#" },
      { name: "Careers", href: "#" },
      { name: "Press Kit", href: "#" },
      { name: "Partners", href: "#" },
      { name: "Blog", href: "#" },
    ],
    support: [
      { name: "Help Center", href: "#" },
      { name: "Contact Us", href: "#" },
      { name: "Status Page", href: "#" },
      { name: "Bug Reports", href: "#" },
      { name: "Feature Requests", href: "#" },
    ],
    legal: [
      { name: "Privacy Policy", href: "#" },
      { name: "Terms of Service", href: "#" },
      { name: "Cookie Policy", href: "#" },
      { name: "GDPR", href: "#" },
      { name: "Security", href: "#" },
    ],
  };

  const socialLinks = [
    { icon: Twitter, href: "https://twitter.com", label: "Twitter" },
    { icon: Facebook, href: "https://facebook.com", label: "Facebook" },
    { icon: Instagram, href: "https://instagram.com", label: "Instagram" },
    { icon: Linkedin, href: "https://linkedin.com", label: "LinkedIn" },
    { icon: Github, href: "https://github.com", label: "GitHub" },
  ];

  return (
    <footer className="bg-card border-border border-t">
      <div className="container mx-auto px-6 py-16">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-6">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <div className="mb-6 flex items-center space-x-2">
              <Video className="text-primary h-8 w-8" />
              <span className="text-foreground text-xl font-bold">
                VideoVenture AI
              </span>
            </div>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              Transform your ideas into professional videos with the power of
              AI. Create stunning content in minutes, not hours.
            </p>

            {/* Contact Info */}
            <div className="mb-6 space-y-3">
              <div className="text-muted-foreground flex items-center space-x-3">
                <Mail className="h-4 w-4" />
                <span>support@videoventure.ai</span>
              </div>
              <div className="text-muted-foreground flex items-center space-x-3">
                <Phone className="h-4 w-4" />
                <span>+1 (555) 123-4567</span>
              </div>
              <div className="text-muted-foreground flex items-center space-x-3">
                <MapPin className="h-4 w-4" />
                <span>Calgary, AB, Canada</span>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex space-x-4">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors duration-300"
                  aria-label={social.label}
                >
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Links Sections */}
          <div>
            <h3 className="text-foreground mb-4 font-semibold">Product</h3>
            <ul className="space-y-3">
              {footerLinks.product.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    className="text-muted-foreground hover:text-primary transition-colors duration-300"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-foreground mb-4 font-semibold">Company</h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    className="text-muted-foreground hover:text-primary transition-colors duration-300"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-foreground mb-4 font-semibold">Support</h3>
            <ul className="space-y-3">
              {footerLinks.support.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    className="text-muted-foreground hover:text-primary transition-colors duration-300"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-foreground mb-4 font-semibold">Legal</h3>
            <ul className="space-y-3">
              {footerLinks.legal.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    className="text-muted-foreground hover:text-primary transition-colors duration-300"
                  >
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-border mt-12 border-t pt-8">
          <div className="flex flex-col items-center justify-between space-y-4 md:flex-row md:space-y-0">
            <p className="text-muted-foreground text-sm">
              © {new Date().getFullYear()} VideoVenture AI. All rights
              reserved.
            </p>
            <div className="text-muted-foreground flex items-center space-x-6 text-sm">
              <span>Made with ❤️ in Canada</span>
              <div className="flex items-center space-x-2">
                <div className="bg-primary h-2 w-2 animate-pulse rounded-full"></div>
                <span>All systems operational</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

// Main App Component to showcase all three
export default function CompletedSections() {
  return (
    <main className="bg-background text-foreground relative min-h-screen overflow-hidden antialiased">
      <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-b from-black via-black/95 to-black"></div>
      <div className="relative z-10">
        <Navbar />
        <Hero />
        <VideoShowcase />
        <Features />
        <HowItWorks />
        <Pricing />
        <FAQ />
        <Footer />
      </div>
    </main>
  );
}
