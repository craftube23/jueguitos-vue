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
        
        # -> Click the 'Jugar ➜' button on the Turbo Drift 2D card to launch the Turbo Drift game.
        # Jugar ➜ button
        elem = page.locator("div:nth-child(4) > .card-footer > .btn-launch-card")
        await elem.click(timeout=10000)
        
        # -> Verify the 'TURBO DRIFT 2D' game view is displayed, then start a short interaction by clicking '¡INICIAR CARRERA!' and pressing 'W', and finally click '⬅️ Volver al Menú Principal' to return to the lobby.
        # 🏁 ¡INICIAR CARRERA! button
        elem = page.get_by_role("button", name="🏁 ¡INICIAR CARRERA!")
        await elem.click(timeout=10000)
        
        # -> Verify the 'TURBO DRIFT 2D' game view is displayed, then start a short interaction by clicking '¡INICIAR CARRERA!' and pressing 'W', and finally click '⬅️ Volver al Menú Principal' to return to the lobby.
        # ⬅️ Volver al Menú Principal button
        elem = page.get_by_role("button", name="⬅️ Volver al Menú Principal")
        await elem.click(timeout=10000)
        
        # -> Hacer clic en el botón 'Jugar ➜' en la tarjeta Turbo Drift 2D para lanzar el juego
        # Jugar ➜ button
        elem = page.locator("div:nth-child(4) > .card-footer > .btn-launch-card")
        await elem.click(timeout=10000)
        
        # -> Hacer clic en el botón '🏁 ¡INICIAR CARRERA!' para iniciar una carrera y luego presionar 'W' para acelerar.
        # 🏁 ¡INICIAR CARRERA! button
        elem = page.get_by_role("button", name="🏁 ¡INICIAR CARRERA!")
        await elem.click(timeout=10000)
        
        # -> Click the '⬅️ Volver al Menú Principal' button to return to the arcade lobby and verify the lobby is displayed.
        # ⬅️ Volver al Menú Principal button
        elem = page.get_by_role("button", name="⬅️ Volver al Menú Principal")
        await elem.click(timeout=10000)
        
        # --> Assertions to verify final state
        
        # --> Arcade lobby is displayed and the Turbo Drift card's 'Jugar ➜' button is visible.
        await page.locator("div:nth-child(4) > .card-footer > .btn-launch-card").nth(0).scroll_into_view_if_needed()
        # Assert-outcome: passed
        # Assert: The Turbo Drift card's 'Jugar ➜' button is visible in the arcade lobby.
        await expect(page.locator("div:nth-child(4) > .card-footer > .btn-launch-card").nth(0)).to_be_visible(timeout=15000), "The Turbo Drift card's 'Jugar \u279c' button is visible in the arcade lobby."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    