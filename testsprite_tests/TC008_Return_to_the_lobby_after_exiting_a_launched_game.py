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
        
        # -> Click the 'Jugar ➜' button on the Valorant 2D: Spike Rush game card to launch the game
        # Jugar ➜ button
        elem = page.locator(".btn-launch-card").first
        await elem.click(timeout=10000)
        
        # -> Click the '⬅️ Volver al Menú Principal' button to return to the arcade lobby.
        # ⬅️ Volver al Menú Principal button
        elem = page.get_by_role("button", name="⬅️ Volver al Menú Principal")
        await elem.click(timeout=10000)
        
        # --> Assertions to verify final state
        
        # --> The arcade lobby is displayed after exiting the game: the page header shows 'VUE ARCADE'.
        # Assert-outcome: passed
        # Assert: The page header displays 'VUE ARCADE'.
        await expect(page.locator("xpath=/html/body/div/div/header/div/div[2]/h1").nth(0)).to_have_text("VUE ARCADE", timeout=15000), "The page header displays 'VUE ARCADE'."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    