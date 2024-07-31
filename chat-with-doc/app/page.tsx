import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import med1 from "../images/med1.jpeg";
import {
  BrainCogIcon,
  EyeIcon,
  GlobeIcon,
  MonitorSmartphone,
  ServerCogIcon,
  ZapIcon,
} from "lucide-react";
const features = [
  {
    name: "store your PDF document",
    description:
      "Maintain the confidentiality of your medical reports and access them anytime",
    icon: GlobeIcon,
  },
  {
    name: "Blazing fast responses",
    description:
      "Ensure the security of your health records and retrieve them easily at any moment",
    icon: ZapIcon,
  },
  {
    name: "Chat Memorization",
    description:
      "Safeguard your medical documents and access them whenever needed",
    icon: BrainCogIcon,
  },
  {
    name: "Interactive PDF viewer",
    description: "Keep your health reports secure and available at all times",
    icon: EyeIcon,
  },
  {
    name: "Cloud Backup",
    description:
      "Protect your medical files and access them effortlessly whenever required",
    icon: MonitorSmartphone,
  },
  {
    name: "Retrieve your PDF document",
    description:
      "Preserve the privacy of your medical records and ensure they are always within reach",
    icon: ServerCogIcon,
  },
];

export default function Home() {
  return (
    <main className="flex-1 overflow-scroll p-2 lg:p-5 bg-gradient-to-bl from-white to-indigo-600">
      <div className="bg-white py-24 sm:py-32 rounded-md drop-shadow-xl">
        <div className="flex flex-col justify-center items-center mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl sm:text-center">
            <h2 className="text-base font-semibold leading-7 text-indigo-600">
              MED-45 AI - Your Personalized AI Health Companion
            </h2>
            {/* <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-6xl"> */}
            <p className="mt-2 text-3xl tracking-tight text-gray-900 sm:text-3xl">
              Are you a , Healthcare provider or and Medical researcher?
            </p>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Convert Your Medical Reports into Engaging Interactions....
            </p>

            <p className="mt-6 text-lg leading-8 text-gray-600">
              Introducing{" "}
              <span className="font-bold text-indigo-600">Med-45 AI</span>
              <br />
              <br />
              Upload your medical reports, and I, Med-45 AI will respond to
              inquiries, summarize information, and offer comprehensive insights
              in an interactive discussion, plus significantly boost your
              comprehension and efficiency.
              {/* <span className="text-indigo-600">Chat with PDF</span> turn static
              documents into{" "}
              <span className="font-bold">dynamic conversation</span>, enhance
              productivity 10x fold effortlessly */}
            </p>
          </div>
          <Button asChild className="mt-10">
            <Link href="/dashboard">Get Started</Link>
          </Button>
        </div>

        <div className="relative overflow-hidden pt-16">
          <div className="mx-auto max-w-7xl px-6 lg:px-6">
            <Image
              alt="App Screenshot"
              // src="https://i.imgur.com/VciRSTI.jpeg"
              src={med1}
              width={2432}
              height={1442}
              className="mb-[-0%] rounded-xl shadow-2xl ring-1 ring-gray-900/10"
            />
            <div aria-hidden="true" className="relative">
              <div className="absolute bottom-0 -insert-x-32 bg-gradient-to-t from-white/95 pt-[5%]" />
            </div>
          </div>
        </div>

        <div className="mx-auto mt-16 max-w-7xl px-6 sm:ml-20 md:mt-24">
          <dl className="mx-auto grid max-w-2xl grid-cols-1 gap-x-6 gap-y-10 text-base leading-7 text-gray-600 sm:grid-cols-2 lg:mx-0 lg:max-w-none lg:grid-cols-3 lg:gap-x-8 lg:gap-y-16">
            {features.map((feature) => (
              <div key={feature.name} className="relative pl-9">
                <dt className="inline font-semibold text-gray-900">
                  <feature.icon
                    aria-hidden="true"
                    className="absolute left-1 top-1 h-5 w-5 text-indigo-600"
                  />
                </dt>
                <dd>{feature.description}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </main>
  );
}
