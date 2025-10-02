import os
import re
import logging
import functools

from playwright.async_api import async_playwright

from src.screenshot_uploader import ScreenshotManager


def safety_tgstat_calls(default_return=None):
    def decorator(func):
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            self = args[0]
            try:
                return await func(*args, **kwargs)
            except Exception as e:
                logging.error(f"{func.__name__} error: {e}")
                return default_return
        return wrapper
    return decorator


class TGstatDataScrapper:
    def __init__(self):
        if not os.path.exists("temp"):
            os.makedirs("temp")

        self.playwright = None
        self.browser = None
        self.context = None
        self.page = None

    async def initialize(self, headless=False):
        self.playwright = await async_playwright().start()
        self.browser = await self.playwright.firefox.launch(headless=headless)

    async def close(self):
        if self.page:
            await self.page.close()
        if self.browser:
            await self.browser.close()
        if self.playwright:
            await self.playwright.stop()

    async def open_page(self, url):
        if not self.browser:
            await self.initialize()
        self.context = await self.browser.new_context(storage_state="temp/auth_state.json")
        self.page = await self.context.new_page()
        await self.page.goto(url)

    async def save_state(self):
        await self.context.storage_state(path="temp/auth_state.json")

    @staticmethod
    def parse_string_to_float(s):
        s = s.replace(" ", "")
        suffix_multipliers = { 'k': 1000, 'm': 1000000, 'b': 1000000000 }
        suffix = s[-1].lower()
        
        try:
            if suffix in suffix_multipliers:
                num = float(s[:-1]) * suffix_multipliers[suffix]
            else:
                num = float(s)
        except ValueError:
            num = 0.0

        return num
    
    @safety_tgstat_calls(default_return=False)
    async def get_rkn_registration(self):
        rkn_element = self.page.locator('span:has-text("Зарегистрирован в РКН")')

        if await rkn_element.count() > 0:
            logging.info("get_rkn_registration success")
            return True
        else:
            logging.info("get_rkn_registration success")
            return False

    @safety_tgstat_calls(default_return=0)
    async def get_citation_index(self):
        citation_index_element = await self.page.locator('div[class="col-lg-6 col-md-12 col-sm-12"]').filter(
            has=self.page.locator('div', has_text="индекс цитирования")).all()
        if len(citation_index_element) < 1:
            citation_index = 0
        else:
            citation_index_field = citation_index_element[0].locator('h2[class="text-dark"]')
            index_str = await citation_index_field.text_content()
            citation_index = self.parse_string_to_float(index_str)
        logging.info("get_citation_index success")
        return citation_index

    @safety_tgstat_calls(default_return=0)
    async def get_avg_coverage(self):
        avg_coverage_element = await self.page.locator('div[class="col-lg-6 col-md-12 col-sm-12"]').filter(
            has=self.page.locator('div', has_text="средний охват")).all()
        if len(avg_coverage_element) < 1:
            avg_coverage = 0
        else:
            avg_coverage_field = avg_coverage_element[0].locator('h2[class="text-dark"]')
            index_str = await avg_coverage_field.text_content()
            avg_coverage = self.parse_string_to_float(index_str)
        logging.info("get_avg_coverage success")
        return avg_coverage

    @safety_tgstat_calls(default_return={'reposts': 0, 'comments': 0, 'reactions': 0})
    async def get_ER_stats(self):
        ER_element = await self.page.locator('div[class="col-lg-6 col-md-12 col-sm-12"]').filter(
            has=self.page.locator('div', has_text=" вовлеченность подписчиков (ER)")).all()

        if ER_element:
            ER_field = ER_element[0].locator('table.mt-1')

            rows = await ER_field.locator('tr').all()

            numbers = []
            for row in rows:
                td = row.locator('td').first
                text = await td.text_content()
                if text.strip():
                    numbers.append(self.parse_string_to_float(text.strip()))
            
            ER_dict = {}
            if len(numbers) == 3:
                ER_dict["reposts"] = numbers[0]
                ER_dict["comments"] = numbers[1]
                ER_dict["reactions"] = numbers[2]

            logging.info("get_ER_stats success")
            return ER_dict

    @safety_tgstat_calls(default_return=None)
    async def make_screenshot(self, path="temp/screen.png"):
        if self.page:
            await self.page.screenshot(path=path)
        else:
            raise Exception("Страница не была открыта корректно")

    @safety_tgstat_calls(default_return="-")
    async def upload_screenshot(self, path="temp/screen.png"):
        scrnManager = ScreenshotManager()
        screenshot = scrnManager.send_screenshot_on_imgdb(path)
        return screenshot
    
    @safety_tgstat_calls(default_return=None)
    async def remove_screenshot(self, path="temp/screen.png"):
        try:
            if os.path.exists(path):
                os.remove(path)
            else:
                raise FileNotFoundError(f"Файл {path} не существует.")
        except Exception as e:
            raise Exception(f"Ошибка при удалении скриншота: {e}")
        
    @safety_tgstat_calls(default_return="-")
    async def get_screenshot_link(self, path="temp/screen.png"):
        await self.make_screenshot(path)
        screenshot = await self.upload_screenshot(path)
        await self.remove_screenshot(path)
        logging.info("get_screenshot_link success")
        return screenshot

    @safety_tgstat_calls(default_return=0)
    async def get_reposts_count(self):
        reposts_count_element = self.page.locator('a[data-original-title="Поделились в публичных каналах и чатах"]')
        text = await reposts_count_element.text_content()

        match = re.search(r'\d+', text)
        if match:
            reposts_count = int(match.group())
        else:
            reposts_count = 0
        logging.info("get_reposts_count success")
        return reposts_count

    
    async def get_all_aviable_info(self, public_link: str, post_link: str = None, screen_check: bool = True ) -> list:
        await self.initialize(headless=True)

        await self.open_page("https://tgstat.ru/channel/@" + public_link + "/stat")
        citation_index = await self.get_citation_index()
        avg_coverage = await self.get_avg_coverage()
        rkn_registration = await self.get_rkn_registration()
        ER_stats = await self.get_ER_stats()
        
        if post_link is not None:
            await self.open_page("https://tgstat.ru/channel/@" + public_link + "/" + post_link)
            reposts_count = await self.get_reposts_count()
        else:
            reposts_count = 0
        
        if not screen_check:
            screenshot = await self.get_screenshot_link()
        else:
            screenshot = "-"

        await self.save_state()
        await self.close()
        logging.info(
            f"""
        {public_link} info:
            RKN Registration: {rkn_registration}
            Citation Index:   {citation_index}
            Avg Coverage:     {avg_coverage}
            ER Stats:         {ER_stats}
            Reposts Count:    {reposts_count}
            Screenshot:       {screenshot}
        """
        )
        return [rkn_registration, citation_index, avg_coverage, ER_stats, reposts_count, screenshot]