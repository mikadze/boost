'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Sparkles,
  Zap,
  Shield,
  BarChart3,
  Code,
  Gift,
  Users,
  ChevronRight,
  Github,
  Twitter,
  Terminal,
  Play,
  Copy,
  Check,
} from 'lucide-react';
import { GlowButton } from '@/components/ui/glow-button';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/glass-card';
import { cn } from '@/lib/utils';

const features = [
  {
    icon: Zap,
    title: 'Real-time Event Processing',
    description:
      'Process millions of events per second with our Kafka-powered pipeline. Sub-50ms latency guaranteed.',
  },
  {
    icon: Gift,
    title: 'Loyalty & Rewards',
    description:
      'Build sophisticated loyalty programs with points, tiers, and personalized rewards.',
  },
  {
    icon: BarChart3,
    title: 'Advanced Analytics',
    description:
      'Get actionable insights with real-time dashboards and comprehensive reporting.',
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    description:
      'SOC 2 compliant with end-to-end encryption and fine-grained access controls.',
  },
  {
    icon: Code,
    title: 'Developer First',
    description:
      'Simple SDKs for all major platforms. Get started in minutes, not days.',
  },
  {
    icon: Users,
    title: 'Customer 360',
    description:
      'Unified customer profiles with complete activity history and segmentation.',
  },
];

const codeSnippet = `import { Boost } from '@boost/sdk';

const boost = new Boost({ apiKey: 'pk_live_...' });

// Track customer events
await boost.track({
  event: 'purchase_completed',
  userId: 'user_123',
  properties: {
    orderId: 'order_456',
    total: 99.99,
    items: ['prod_a', 'prod_b']
  }
});

// Check loyalty status
const loyalty = await boost.loyalty.getStatus('user_123');
console.log(\`User has \${loyalty.points} points\`);`;

const pipelineSteps = [
  { label: 'Your App', icon: Code },
  { label: 'Boost API', icon: Zap },
  { label: 'Kafka', icon: ArrowRight },
  { label: 'Worker', icon: Terminal },
  { label: 'Database', icon: BarChart3 },
];

function Navbar() {
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled ? 'glass-strong py-3' : 'py-6'
      )}
    >
      <div className="container mx-auto px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold">Boost</span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <Link
            href="#features"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Features
          </Link>
          <Link
            href="#developers"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Developers
          </Link>
          <Link
            href="#pricing"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Pricing
          </Link>
          <Link
            href="/docs"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Docs
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild>
            <Link href="/sign-in">Sign In</Link>
          </Button>
          <GlowButton asChild>
            <Link href="/sign-up">Get Started</Link>
          </GlowButton>
        </div>
      </div>
    </motion.nav>
  );
}

function HeroSection() {
  const [copied, setCopied] = React.useState(false);
  const [mousePosition, setMousePosition] = React.useState({ x: 0, y: 0 });

  const handleCopy = async () => {
    await navigator.clipboard.writeText('npm install @boost/sdk');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    const x = (clientX / window.innerWidth - 0.5) * 20;
    const y = (clientY / window.innerHeight - 0.5) * 20;
    setMousePosition({ x, y });
  };

  return (
    <section
      className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden"
      onMouseMove={handleMouseMove}
    >
      {/* Light theme gradient background */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5" />
      </div>
      <div className="absolute inset-0 grid-pattern opacity-20" />

      <div className="container mx-auto px-6 py-20 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8"
          >
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm">Now in public beta</span>
            <ChevronRight className="h-4 w-4" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: 0.1,
              type: 'spring',
              stiffness: 150,
              damping: 15
            }}
            style={{
              transform: `translate(${mousePosition.x * 0.5}px, ${mousePosition.y * 0.5}px)`,
            }}
            className="text-5xl md:text-7xl font-bold leading-tight parallax-slow"
          >
            The{' '}
            <span className="gradient-text">loyalty engine</span>
            <br />
            for modern apps
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-muted-foreground mt-6 max-w-2xl mx-auto"
          >
            Build engaging customer experiences with real-time event tracking,
            powerful promotions, and intelligent loyalty programs.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-10"
          >
            <GlowButton variant="glow" size="lg" className="button-apple magnetic" asChild>
              <Link href="/sign-up">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </GlowButton>
            <Button variant="outline" size="lg" className="magnetic-subtle" asChild>
              <Link href="/docs">
                <Play className="mr-2 h-5 w-5" />
                Watch Demo
              </Link>
            </Button>
          </motion.div>

          {/* Install command */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-8"
          >
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-3 px-4 py-2 rounded-lg glass hover:bg-surface-2 transition-colors"
            >
              <Terminal className="h-4 w-4 text-muted-foreground" />
              <code className="text-sm">npm install @boost/sdk</code>
              {copied ? (
                <Check className="h-4 w-4 text-green-400" />
              ) : (
                <Copy className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
          </motion.div>
        </div>

        {/* Code preview */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.5,
            type: 'spring',
            stiffness: 100,
            damping: 15
          }}
          style={{
            transform: `translate(${mousePosition.x * 0.3}px, ${mousePosition.y * 0.3}px)`,
          }}
          className="max-w-3xl mx-auto mt-16 parallax-medium"
        >
          <GlassCard className="overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
              <div className="h-3 w-3 rounded-full bg-red-500" />
              <div className="h-3 w-3 rounded-full bg-yellow-500" />
              <div className="h-3 w-3 rounded-full bg-green-500" />
              <span className="ml-2 text-xs text-muted-foreground">
                app.ts
              </span>
            </div>
            <pre className="p-4 text-sm overflow-x-auto">
              <code className="text-muted-foreground">{codeSnippet}</code>
            </pre>
          </GlassCard>
        </motion.div>
      </div>
    </section>
  );
}

function FeaturesSection() {
  return (
    <section id="features" className="py-24 relative">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold">
            Everything you need to{' '}
            <span className="gradient-text">grow revenue</span>
          </h2>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
            A complete platform for customer engagement, from event tracking to
            personalized rewards.
          </p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
              whileInView={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{
                duration: 0.6,
                delay: index * 0.1,
                ease: [0.34, 1.56, 0.64, 1],
              }}
            >
              <GlassCard className="h-full magnetic-subtle transition-all duration-300">
                <div className="p-6">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">
                    {feature.description}
                  </p>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PipelineSection() {
  return (
    <section id="developers" className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 dot-pattern opacity-50" />

      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold">
            Built for{' '}
            <span className="gradient-text">scale</span>
          </h2>
          <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">
            Our event-driven architecture processes millions of events in real-time
            with guaranteed delivery.
          </p>
        </motion.div>

        {/* Pipeline animation */}
        <div className="flex items-center justify-center gap-4 flex-wrap">
          {pipelineSteps.map((step, index) => (
            <React.Fragment key={step.label}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  delay: index * 0.2,
                  duration: 0.5,
                  ease: [0.34, 1.56, 0.64, 1],
                }}
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="flex flex-col items-center"
              >
                <div className="magnetic-subtle">
                  <div className="h-16 w-16 rounded-xl glass flex items-center justify-center mb-2">
                    <step.icon className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <span className="text-sm text-muted-foreground">
                  {step.label}
                </span>
              </motion.div>
              {index < pipelineSteps.length - 1 && (
                <motion.div
                  initial={{ scaleX: 0, opacity: 0 }}
                  whileInView={{ scaleX: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{
                    delay: index * 0.2 + 0.15,
                    duration: 0.4,
                  }}
                  style={{ originX: 0 }}
                  className="h-0.5 w-12 bg-gradient-to-r from-primary/50 to-primary hidden sm:block"
                />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="grid gap-6 md:grid-cols-4 mt-16"
        >
          {[
            { value: '50ms', label: 'Avg. latency' },
            { value: '99.99%', label: 'Uptime SLA' },
            { value: '10M+', label: 'Events/second' },
            { value: '<1ms', label: 'Cache response' },
          ].map((stat) => (
            <GlassCard key={stat.label} className="text-center p-6">
              <p className="text-3xl font-bold gradient-text">{stat.value}</p>
              <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
            </GlassCard>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <GlassCard className="p-12 text-center gradient-border">
            <h2 className="text-4xl font-bold mb-4">
              Ready to boost your business?
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto mb-8">
              Join thousands of companies using Boost to create engaging customer
              experiences and drive growth.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <GlowButton variant="glow" size="lg" className="button-apple magnetic" asChild>
                <Link href="/sign-up">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </GlowButton>
              <Button variant="outline" size="lg" className="magnetic-subtle" asChild>
                <Link href="/contact">Contact Sales</Link>
              </Button>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </section>
  );
}

function ScrollProgress() {
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = (window.scrollY / totalHeight) * 100;
      setProgress(progress);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-1 bg-primary z-50 origin-left"
      style={{ scaleX: progress / 100 }}
    />
  );
}

function Footer() {
  return (
    <footer className="border-t border-border py-12">
      <div className="container mx-auto px-6">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Sparkles className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">Boost</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              The loyalty engine for modern applications.
            </p>
            <div className="flex gap-4 mt-4">
              <Link href="#" className="text-muted-foreground hover:text-foreground">
                <Github className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-foreground">
                <Twitter className="h-5 w-5" />
              </Link>
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="#" className="hover:text-foreground">Features</Link></li>
              <li><Link href="#" className="hover:text-foreground">Pricing</Link></li>
              <li><Link href="#" className="hover:text-foreground">Changelog</Link></li>
              <li><Link href="#" className="hover:text-foreground">Roadmap</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Developers</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="#" className="hover:text-foreground">Documentation</Link></li>
              <li><Link href="#" className="hover:text-foreground">API Reference</Link></li>
              <li><Link href="#" className="hover:text-foreground">SDKs</Link></li>
              <li><Link href="#" className="hover:text-foreground">Status</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="#" className="hover:text-foreground">About</Link></li>
              <li><Link href="#" className="hover:text-foreground">Blog</Link></li>
              <li><Link href="#" className="hover:text-foreground">Careers</Link></li>
              <li><Link href="#" className="hover:text-foreground">Contact</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Boost. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link href="#" className="hover:text-foreground">Privacy</Link>
            <Link href="#" className="hover:text-foreground">Terms</Link>
            <Link href="#" className="hover:text-foreground">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <ScrollProgress />
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <PipelineSection />
      <CTASection />
      <Footer />
    </div>
  );
}
