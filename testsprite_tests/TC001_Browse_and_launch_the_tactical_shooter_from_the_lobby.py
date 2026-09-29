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
        
        # -> Click the 'Táctico' category tag to filter the catalog to tactical games.
        # Táctico
        elem = page.get_by_text("Táctico", exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the '🚪 ¡INICIAR INCURSIÓN (BREACH)!' button to launch the tactical shooter.
        # 🚪 ¡INICIAR INCURSIÓN (BREACH)! button
        elem = page.get_by_role("button", name="🚪 ¡INICIAR INCURSIÓN (BREACH")
        await elem.click(timeout=10000)
        
        # --> Assertions to verify final state
        
        # --> The tactical shooter entry is present in the page header (Tactical Breach).
        await page.get_by_role("button", name="🎯 Tactical Breach").nth(0).scroll_into_view_if_needed()
        # Assert-outcome: failed
        # Assert: Expected the tactical shooter card to be visible.
        await expect(page.get_by_role("button", name="🎯 Tactical Breach").nth(0)).to_be_visible(timeout=15000), "Expected the tactical shooter card to be visible."
        
        # --> Agent selection screen did not appear after launching; gameplay canvas is visible instead.
        # Assert-outcome: failed
        # Assert: Expected the gameplay canvas to be hidden while the agent selection screen is displayed.
        await expect(page.locator("xpath=/html/body/div[1]/div/main/div[2]/div/canvas").nth(0)).not_to_be_visible(timeout=15000), "Expected the gameplay canvas to be hidden while the agent selection screen is displayed."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    