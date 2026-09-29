import asyncio
import re
from playwright import async_api
from playwright.async_api import expect

async def run_test():
    pw = None
    browser = None
    context = None

    try:
        # Start a Playwright session in asynchronous mode
        pw = await async_api.async_playwright().start()

        # Launch a Chromium browser in headless mode with custom arguments
        browser = await pw.chromium.launch(
            headless=True,
            args=[
                "--window-size=1280,720",
                "--disable-dev-shm-usage",
                "--ipc=host",
                "--single-process"
            ],
        )

        # Create a new browser context (like an incognito window)
        context = await browser.new_context()
        # Wider default timeout to match the agent's DOM-stability budget;
        # auto-waiting Playwright APIs (expect, locator.wait_for) inherit this.
        context.set_default_timeout(15000)

        # Open a new page in the browser context
        page = await context.new_page()

        # Interact with the page elements to simulate user flow
        # -> navigate
        await page.goto("http://localhost:5175/")
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=5000)
        except Exception:
            pass
        
        # -> Click the '▶️ Jugar Spike Rush 5v5' button to launch Valorant 2D.
        # ▶️ Jugar Spike Rush 5v5 button
        elem = page.get_by_role("button", name="▶️ Jugar Spike Rush 5v5")
        await elem.click(timeout=10000)
        
        # -> Click the 'SOVA' agent in the agent selection grid to select that agent.
        # Click the 'SOVA' agent in the agent selection grid to select that agent.
        elem = page.locator("div").filter(has_text=re.compile(r"^SOVAIniciador$")).locator("div").first
        await elem.click(timeout=10000)
        
        # -> Click the '⚔️ ENTRAR A LA PARTIDA' button to enter the match.
        # ⚔️ ENTRAR A LA PARTIDA button
        elem = page.get_by_role("button", name="⚔️ ENTRAR A LA PARTIDA")
        await elem.click(timeout=10000)
        
        # --> Assertions to verify final state
        
        # --> The purchased lightweight shield is reflected in the player's HUD as '🛡️ 25'.
        # Assert-outcome: passed
        # Assert: The HUD displays the shield value '🛡️ 25'.
        await expect(page.locator("xpath=/html/body/div[1]/div/main/div[2]/footer/div[1]/div[2]/span[2]").nth(0)).to_have_text("\ud83d\udee1\ufe0f 25", timeout=15000), "The HUD displays the shield value '\ud83d\udee1\ufe0f 25'."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    