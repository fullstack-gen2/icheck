import type { Metadata } from "next";
import { FileTextIcon } from "lucide-react";
import { MarketingPage } from "@/components/marketing/marketing-shell";

export const metadata: Metadata = {
  title: "Terms of Service | iCheck",
  description: "Terms of service for the iCheck attendance platform.",
};

const terms = [
  {
    title: "Use of the service",
    body: "iCheck is provided for schools, training centers, teachers, students, and administrators to manage attendance, reports, notifications, and related classroom operations.",
  },
  {
    title: "Account responsibility",
    body: "Users are responsible for keeping their account credentials secure and for using the platform only for authorized organization or classroom activity.",
  },
  {
    title: "Attendance data",
    body: "Organizations are responsible for the accuracy of schedules, classrooms, student enrollment, attendance policies, and manual attendance changes entered by their users.",
  },
  {
    title: "Acceptable use",
    body: "Users may not abuse the platform, attempt unauthorized access, interfere with system security, or submit false attendance information.",
  },
  {
    title: "Changes",
    body: "iCheck may update these terms as the service evolves. Continued use of the service means users accept the updated terms.",
  },
];

export default function TermsPage() {
  return (
    <MarketingPage
      title="Terms of Service"
      description="These terms describe the basic rules for using iCheck and managing attendance data responsibly."
    >
      <section className="bg-[#f7f9fd]">
        <div className="mx-auto max-w-4xl px-5 py-20">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm md:p-10">
            <FileTextIcon className="size-10 text-[#253c95]" />
            <p className="mt-6 text-sm font-semibold uppercase text-slate-500">
              Effective date: June 22, 2026
            </p>
            <div className="mt-8 space-y-8">
              {terms.map((section) => (
                <div key={section.title}>
                  <h2 className="text-xl font-bold tracking-normal text-slate-950">
                    {section.title}
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{section.body}</p>
                </div>
              ))}
            </div>
            <div className="mt-10 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm leading-6 text-slate-600">
              For terms questions, contact{" "}
              <a
                href="mailto:kimchanthon46@gmail.com"
                className="font-semibold text-[#253c95] underline-offset-4 hover:underline"
              >
                kimchanthon46@gmail.com
              </a>
              .
            </div>
          </div>
        </div>
      </section>
    </MarketingPage>
  );
}
