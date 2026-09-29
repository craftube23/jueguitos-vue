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
        
        # -> Select the 'JETT' agent in the agent selection grid.
        # JETT Duelista
        elem = page.get_by_text("JETTDuelista")
        await elem.click(timeout=10000)
        
        # -> Click the '⚔️ ENTRAR A LA PARTIDA' button after selecting a team to enter the match
        # 🔥 ATACANTES (Plantar Spike) button
        elem = page.get_by_role("button", name="🔥 ATACANTES (Plantar Spike)")
        await elem.click(timeout=10000)
        
        # -> Click the '⚔️ ENTRAR A LA PARTIDA' button after selecting a team to enter the match
        # ⚔️ ENTRAR A LA PARTIDA button
        elem = page.get_by_role("button", name="⚔️ ENTRAR A LA PARTIDA")
        await elem.click(timeout=10000)
        
        # --> Assertions to verify final state
        
        # --> Spectator mode could not be verified because no spectate/cycling UI or labels were present on the in-round page.
        # Assert-outcome: failed
        # Assert: Expected the in-round HUD to contain spectate/cycling text (e.g. 'ESPECTADOR') to indicate spectator mode.
        await expect(page.get_by_role("main").nth(0)).to_contain_text("ESPECTADOR", timeout=15000), "Expected the in-round HUD to contain spectate/cycling text (e.g. 'ESPECTADOR') to indicate spectator mode."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    