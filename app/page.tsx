import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { MarketingNav } from "@/components/marketing/MarketingNav";
import { Hero } from "@/components/marketing/Hero";
import { Features } from "@/components/marketing/Features";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <MarketingNav />
      <main className="flex-1">
        <Hero />
        <Features />

        {/* Closing call to action */}
        <section className="mx-auto w-full max-w-4xl px-6 pb-20">
          <div className="border border-border bg-card p-10 text-center sm:p-14">
            <h2 className="font-serif text-3xl font-medium tracking-tight sm:text-4xl">
              Ready to write without limits?
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
              Create your first document in seconds. No credit card, works
              offline from the start.
            </p>
            <div className="mt-8 flex justify-center">
              <Button
                size="lg"
                nativeButton={false}
                render={<Link href="/register" />}
              >
                Get started
                <ArrowRight className="size-4" />
              </Button>
            </div>
          </div>
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}
