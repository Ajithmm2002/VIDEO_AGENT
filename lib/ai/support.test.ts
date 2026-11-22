import { describe, expect, it } from "vitest";
import { EXAMPLE_SUPPORT_EMAIL, EXAMPLE_SUPPORT_PHONE, localSupportReply } from "@/lib/ai/support";

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
    expect(reply).not.toContain(EXAMPLE_SUPPORT_EMAIL);
  });

  it("sends the example support email and phone when asked", () => {
    const reply = localSupportReply("what is the customer support number and email?");
    expect(reply).toContain(EXAMPLE_SUPPORT_EMAIL);
    expect(reply).toContain(EXAMPLE_SUPPORT_PHONE);
    expect(reply.toLowerCase()).toMatch(/example/);
  });

  it("explains marketplace reviews", () => {
    const reply = localSupportReply("how do I leave a rating and review?");
    expect(reply.toLowerCase()).toMatch(/280|star/);
  });

  it("guides generate failures", () => {
    const reply = localSupportReply("Generate failed with a Gemini error");
    expect(reply.toLowerCase()).toMatch(/generate|busy|sign in/);
  });

  it("guides save errors", () => {
    const reply = localSupportReply("could not save this content");
    expect(reply.toLowerCase()).toMatch(/sign in/);
  });

  it("adds contact details when an error also asks for email", () => {
    const reply = localSupportReply("something went wrong, send me support email");
    expect(reply.toLowerCase()).toMatch(/try again|refresh/);
    expect(reply).toContain(EXAMPLE_SUPPORT_EMAIL);
  });
});
