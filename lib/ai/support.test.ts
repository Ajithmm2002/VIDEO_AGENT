import { describe, expect, it } from "vitest";
import { localSupportReply } from "@/lib/ai/support";

describe("support replies", () => {
  it("explains session timeout", () => {
    const reply = localSupportReply("why was I logged out after many days?");
    expect(reply.toLowerCase()).toMatch(/14 days|7 days/);
  });

  it("explains coins are not cash", () => {
    const reply = localSupportReply("can I withdraw coins as rupees?");
    expect(reply.toLowerCase()).toMatch(/not money|in-app/);
  });

  it("points to copy buttons for titles and tags", () => {
    const reply = localSupportReply("how do I copy the description and tags?");
    expect(reply.toLowerCase()).toMatch(/copy/);
  });

  it("explains the phone menu", () => {
    const reply = localSupportReply("where is the hamburger menu on my phone?");
    expect(reply.toLowerCase()).toMatch(/menu/);
  });
});
