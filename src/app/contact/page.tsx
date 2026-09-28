"use client";

import { useActionState } from "react";
import { submitContactForm } from "@/actions/contact.actions";
import Link from "next/link";
import { Phone, Mail } from "lucide-react";

export default function ContactPage() {
  const [state, formAction, isPending] = useActionState(submitContactForm, null);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="px-6 py-4 flex items-center justify-between border-b border-border bg-surface shrink-0">
        <Link href="/" className="text-xl font-bold tracking-tight text-primary">
          Personal OS
        </Link>
        <Link href="/login" className="text-sm font-medium hover:underline text-muted-foreground hover:text-foreground">
          Sign In
        </Link>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-2xl space-y-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">Contact Us</h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Have a question or feedback? We&apos;d love to hear from you.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8">
            <div className="space-y-6">
              <div className="bg-surface p-6 rounded-2xl border border-border">
                <h3 className="font-medium text-lg mb-4">Direct Contact</h3>
                <div className="space-y-4 text-muted-foreground text-sm">
                  <div className="flex items-center space-x-3">
                    <Phone className="h-5 w-5 text-primary" />
                    <a href="tel:01753070584" className="hover:text-primary transition-colors font-medium text-foreground">
                      01753070584
                    </a>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-primary" />
                    <a href="mailto:support@personalos.com" className="hover:text-primary transition-colors">
                      support@personalos.com
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-surface p-6 rounded-2xl border border-border">
              {state?.success ? (
                <div className="h-full flex flex-col items-center justify-center space-y-4 py-8">
                  <div className="h-12 w-12 bg-success/10 text-success rounded-full flex items-center justify-center">
                    <Mail className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-medium text-foreground text-center">Message Sent</h3>
                  <p className="text-center text-muted-foreground text-sm">
                    {state.message}
                  </p>
                  <button 
                    onClick={() => window.location.reload()} 
                    className="mt-4 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg text-sm font-medium hover:bg-secondary/80"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form action={formAction} className="space-y-4">
                  {state?.error && (
                    <div className="p-3 text-sm font-medium text-danger-foreground bg-danger/90 rounded-md">
                      {state.error}
                    </div>
                  )}
                  
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-foreground">Name</label>
                    <input
                      type="text"
                      name="name"
                      required
                      className="block w-full rounded-md border border-border bg-background px-3 py-2 text-foreground shadow-sm focus:border-focus focus:outline-none focus:ring-1 focus:ring-focus sm:text-sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-foreground">Email</label>
                    <input
                      type="email"
                      name="email"
                      required
                      className="block w-full rounded-md border border-border bg-background px-3 py-2 text-foreground shadow-sm focus:border-focus focus:outline-none focus:ring-1 focus:ring-focus sm:text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-foreground">Phone <span className="text-muted-foreground font-normal">(optional)</span></label>
                      <input
                        type="tel"
                        name="phone"
                        className="block w-full rounded-md border border-border bg-background px-3 py-2 text-foreground shadow-sm focus:border-focus focus:outline-none focus:ring-1 focus:ring-focus sm:text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-foreground">Subject</label>
                      <input
                        type="text"
                        name="subject"
                        className="block w-full rounded-md border border-border bg-background px-3 py-2 text-foreground shadow-sm focus:border-focus focus:outline-none focus:ring-1 focus:ring-focus sm:text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-foreground">Message</label>
                    <textarea
                      name="message"
                      required
                      rows={4}
                      className="block w-full rounded-md border border-border bg-background px-3 py-2 text-foreground shadow-sm focus:border-focus focus:outline-none focus:ring-1 focus:ring-focus sm:text-sm resize-none custom-scrollbar"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isPending}
                      className="w-full flex justify-center rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:opacity-50 transition-colors"
                    >
                      {isPending ? "Sending..." : "Send Message"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
