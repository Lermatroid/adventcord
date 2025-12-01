import Link from "next/link";

export default function DonatePage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-gold text-lg">--- Support Advent of Code ---</h1>
      </div>
      <div className="space-y-6">
        <p className="text-foreground/80">
          <span className="text-red-500 font-bold">
            Before donating to Adventcord
          </span>
          , please make sure you have already donated to{" "}
          <Link href="https://adventofcode.com/support">Advent of Code</Link>{" "}
          directly. The ammount of work that goes into Advent of Code is
          immense, and much more intensive than a silly webhook notification
          service {":)"}
        </p>
      </div>
      <div>
        <h1 className="text-gold text-lg">--- Support Adventcord ---</h1>
      </div>

      <div className="space-y-6">
        <p className="text-foreground/80">
          Donations help cover the cost of the server and other expenses, thanks
          for your support!
        </p>

        <div className="border border-input-border p-4 space-y-4">
          <p className="text-silver">--- Ways to Support ---</p>

          {/* Add donation links/buttons here */}
          <ul className="space-y-2 pl-4">
            <li>
              <Link
                href="https://paypal.me/liamrmurray"
                target="_blank"
                rel="noopener noreferrer"
                className="text-green hover:text-link-hover"
              >
                [Paypal]
              </Link>
            </li>
            <li>
              <Link
                href="https://ko-fi.com/lermatroid"
                target="_blank"
                rel="noopener noreferrer"
                className="text-green hover:text-link-hover"
              >
                [Ko-fi]
              </Link>
            </li>
          </ul>
        </div>

        {/* <p className="text-foreground/50 text-sm">
          Thank you for your support! ⭐
        </p> */}
      </div>
    </div>
  );
}
