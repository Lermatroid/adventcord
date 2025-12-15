import Link from "next/link";

export default function FAQPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-gold text-lg">
          --- Frequently Asked Questions ---
        </h1>
      </div>

      <div className="space-y-6">
        <FAQItem question="Is this associated with Advent of Code?">
          No, this is a standalone project from Advent of Code.
        </FAQItem>
        <FAQItem question="Is it open source?">
          <Link href="https://github.com/Lermatroid/adventcord">Yep!</Link> You
          can use Adventcord through this site or self-host your own instance.
        </FAQItem>
        <FAQItem question="Is it free to use?">
          Yes, it is free to use! If you want to support the project (and have
          already bought{" "}
          <Link href="https://adventofcode.com/support">AoC++</Link>!){" "}
          <Link href="/donate">donations</Link> are greatly appreciated {":)"}.
          They are used to cover the cost of the server and other expenses.
        </FAQItem>
        <FAQItem question="When does Adventcord run?">
          Adventcord runs throughout the duration of the Advent of Code event
          until 24hr after the last puzzle is released.
        </FAQItem>
        <FAQItem question="Does it follow the rules of the Advent of Code API?">
          Yep. We cache leaderboard data to avoid API abuse.
        </FAQItem>
        <FAQItem question="Why webhooks (Not a bot)?">
          The less access we have, the better! This makes it easy to use
          adventcord on private discord servers and slack workspaces.
        </FAQItem>
        <FAQItem question="Who made this?">
          Hello! I&apos;m Liam, the creator of Adventcord. You can find me on{" "}
          <Link href={"https://liam.so/twitter"}>Twitter</Link>,{" "}
          <Link href={"https://liam.so/bsky"}>Bluesky</Link>, and{" "}
          <Link href={"https://liam.so/links"}>
            other places on the internet
          </Link>
          .
        </FAQItem>
      </div>
    </div>
  );
}

interface FAQItemProps {
  question: string;
  children: React.ReactNode;
}

export function FAQItem({ question, children }: FAQItemProps) {
  return (
    <div className="space-y-2">
      <p className="text-green">Q: {question}</p>
      <p className="text-foreground/80 pl-4">A: {children}</p>
    </div>
  );
}
