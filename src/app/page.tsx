import Link from "next/link";

export default function Home() {
  return (
    <div className="space-y-8">
      {/* ASCII Art Header */}
      <pre className="text-green text-xs sm:text-sm overflow-x-auto">
        {`  *        .    *       .        *   .       *    .
      .        *     .       *        .   *
    _       _                 _                    _
   /_\\   __| |_   _____ _ __ | |_ ___ ___  _ __ __| |
  //_\\\\ / _\` \\ \\ / / _ \\ '_ \\| __/ __/ _ \\| '__/ _\` |
 /  _  \\ (_| |\\ V /  __/ | | | || (_| (_) | | | (_| |
 \\_/ \\_/\\__,_| \\_/ \\___|_| |_|\\__\\___\\___/|_|  \\__,_|
      *        .     *      .        *       .
  .       *    .        *       .  *     .      *`}
      </pre>

      <div className="space-y-6">
        <p>
          Get <span className="text-gold">Discord notifications</span> for your{" "}
          <a
            href="https://adventofcode.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            Advent of Code
          </a>{" "}
          private leaderboard standings.
        </p>

        <div className="border border-input-border p-4 space-y-4">
          <p className="text-silver">--- How it works ---</p>

          <ol className="list-none space-y-2 pl-4">
            <li>
              <span className="text-green">1.</span> Get your private
              leaderboard&apos;s{" "}
              <span className="text-gold">read-only link</span> from AoC
            </li>
            <li>
              <span className="text-green">2.</span> Create a{" "}
              <span className="text-gold">Discord webhook</span> in your server
            </li>
            <li>
              <span className="text-green">3.</span> Pick which{" "}
              <span className="text-gold">hours</span> you want updates (Eastern
              time)
            </li>
            <li>
              <span className="text-green">4.</span> Sit back and watch the{" "}
              <span className="text-gold">competition</span> unfold
            </li>
          </ol>
        </div>

        <div className="space-y-2">
          <p className="text-silver">--- Getting your leaderboard link ---</p>
          <p className="text-foreground/80">
            Go to{" "}
            <a
              href="https://adventofcode.com/leaderboard/private"
              target="_blank"
              rel="noopener noreferrer"
            >
              [Leaderboards]
            </a>{" "}
            on AoC, find your private leaderboard, and copy the{" "}
            <span className="text-green">&quot;read-only link&quot;</span>. It
            should look like:
          </p>
          <code className="block bg-input-bg border border-input-border p-2 text-xs overflow-x-auto">
            https://adventofcode.com/2025/leaderboard/private/view/123456?view_key=abc123
          </code>
        </div>

        <div className="space-y-2">
          <p className="text-silver">--- Creating a Discord webhook ---</p>
          <p className="text-foreground/80">
            In Discord: Server Settings → Integrations → Webhooks → New Webhook.
            Copy the webhook URL.
          </p>
        </div>

        <div className="flex gap-4 pt-4">
          <Link
            href="/create"
            className="border border-green px-4 py-2 hover:bg-green hover:text-background transition-colors"
          >
            [Create Subscription]
          </Link>
          <Link
            href="/edit"
            className="border border-input-border px-4 py-2 hover:border-green transition-colors"
          >
            [Edit Existing]
          </Link>
        </div>
      </div>

      {/* Footer decoration */}
      <pre className="text-green/30 text-xs">
        {`
.  *  .    *    .   *   .  *    .    *   .   *  .
        `}
      </pre>
      <p className="text-xs">
        Adventcord is not affiliated with Advent of Code.
        <br />
        <br />
        Made with ❤️ and {"</>"} by{" "}
        <Link href="https://liam.so/links">Liam</Link>
      </p>
    </div>
  );
}
