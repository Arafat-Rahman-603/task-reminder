"use client";

import { useActionState } from "react";
import { submitContactForm } from "@/actions/contact.actions";
import Link from "next/link";
import { Phone, Mail, ArrowLeft, Send, CheckCircle2, MessageSquare } from "lucide-react";

export default function ContactPage() {
  const [state, formAction, isPending] = useActionState(submitContactForm, null);

  return (
    <div className="w-full px-5 py-16 md:py-24">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container border border-primary/20 text-stitch-primary text-xs font-semibold tracking-wide mb-4">
            <MessageSquare className="w-3.5 h-3.5" />
            Get in Touch
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-on-surface font-headline">Contact Us</h1>
          <p className="mt-3 text-on-surface-variant max-w-md mx-auto">
            Have a question or feedback? We&apos;d love to hear from you.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {/* Contact Info */}
          <div className="md:col-span-2 space-y-4">
            <div className="rounded-2xl bg-surface-container/60 backdrop-blur-xl border border-surface-container-high p-6 space-y-5 shadow-sm">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-stitch-primary">Direct Contact</h3>

              <a
                href="tel:01753070584"
                className="flex items-center gap-4 p-3 rounded-xl hover:bg-surface-container-high/60 transition-colors group"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-stitch-primary flex items-center justify-center shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[11px] text-on-surface-variant uppercase tracking-wider font-semibold">Phone</p>
                  <p className="text-sm font-medium text-on-surface group-hover:text-stitch-primary transition-colors">01753070584</p>
                </div>
              </a>

              <a
                href="mailto:support@personalos.com"
                className="flex items-center gap-4 p-3 rounded-xl hover:bg-surface-container-high/60 transition-colors group"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-stitch-primary flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[11px] text-on-surface-variant uppercase tracking-wider font-semibold">Email</p>
                  <p className="text-sm font-medium text-on-surface group-hover:text-stitch-primary transition-colors">support@personalos.com</p>
                </div>
              </a>
            </div>

            <div className="rounded-2xl bg-surface-container/60 backdrop-blur-xl border border-surface-container-high p-6 shadow-sm">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-stitch-primary mb-3">Response Time</h3>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                We typically respond within 24 hours. For urgent support, call us directly.
              </p>
            </div>
          </div>

          {/* Contact Form */}
          <div className="md:col-span-3">
            <div className="rounded-2xl bg-surface-container/60 backdrop-blur-xl border border-surface-container-high p-6 shadow-sm">
              {state?.success ? (
                <div className="py-12 flex flex-col items-center justify-center gap-4 text-center">
                  <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-success" />
                  </div>
                  <h3 className="text-lg font-semibold text-on-surface">Message Sent!</h3>
                  <p className="text-sm text-on-surface-variant max-w-sm">{state.message || "Thank you for reaching out. We'll get back to you soon."}</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="mt-2 px-6 py-2.5 rounded-xl bg-stitch-primary text-on-primary text-sm font-semibold hover:bg-primary-fixed-dim transition-colors"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form action={formAction} className="space-y-4">
                  {state?.error && (
                    <div className="p-3 text-sm font-medium text-danger-foreground bg-danger/90 rounded-xl text-center">
                      {state.error}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-on-surface-variant" htmlFor="name">Your Name</label>
                      <input
                        id="name"
                        type="text"
                        name="name"
                        required
                        placeholder="John Doe"
                        className="h-11 px-3.5 rounded-xl bg-surface-container-high/60 text-on-surface placeholder:text-on-surface-variant/40 text-sm focus:outline-none focus:bg-surface-container-high transition-all border-0"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-on-surface-variant" htmlFor="email">Email Address</label>
                      <input
                        id="email"
                        type="email"
                        name="email"
                        required
                        placeholder="name@example.com"
                        className="h-11 px-3.5 rounded-xl bg-surface-container-high/60 text-on-surface placeholder:text-on-surface-variant/40 text-sm focus:outline-none focus:bg-surface-container-high transition-all border-0"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-on-surface-variant" htmlFor="phone">
                        Phone <span className="text-on-surface-variant/50 font-normal">(optional)</span>
                      </label>
                      <input
                        id="phone"
                        type="tel"
                        name="phone"
                        placeholder="+88 01..."
                        className="h-11 px-3.5 rounded-xl bg-surface-container-high/60 text-on-surface placeholder:text-on-surface-variant/40 text-sm focus:outline-none focus:bg-surface-container-high transition-all border-0"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium text-on-surface-variant" htmlFor="subject">Subject</label>
                      <input
                        id="subject"
                        type="text"
                        name="subject"
                        required
                        placeholder="How can we help?"
                        className="h-11 px-3.5 rounded-xl bg-surface-container-high/60 text-on-surface placeholder:text-on-surface-variant/40 text-sm focus:outline-none focus:bg-surface-container-high transition-all border-0"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-on-surface-variant" htmlFor="message">Message</label>
                    <textarea
                      id="message"
                      name="message"
                      required
                      rows={5}
                      placeholder="Tell us more about your question or feedback..."
                      className="px-3.5 py-3 rounded-xl bg-surface-container-high/60 text-on-surface placeholder:text-on-surface-variant/40 text-sm focus:outline-none focus:bg-surface-container-high transition-all border-0 resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isPending}
                    className="w-full h-12 rounded-xl bg-stitch-primary text-on-primary font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-primary/20 active:scale-[0.98] transition-transform disabled:opacity-80 disabled:pointer-events-none mt-2"
                  >
                    {isPending ? "Sending..." : <><Send className="w-4 h-4" /> Send Message</>}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
