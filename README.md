<p align="center">
  <a href="https://devsponsors.github.io">
    <img src="https://devsponsors.github.io/assets/badges/sponsor.svg" alt="DevSponsors Badge">
  </a>
</p>

<!-- DevSponsors Badges -->
<p align="center">
  <a href="https://devsponsors.github.io"><img src="https://img.shields.io/badge/DevSponsors-Verified_OSS-6366f1?style=for-the-badge&logo=github" alt="DevSponsors Verified"></a>
  <a href="https://devsponsors.github.io"><img src="https://img.shields.io/badge/Sponsor-DevSponsors_Hub-emerald?style=for-the-badge&logo=github-sponsors" alt="DevSponsors Sponsor"></a>
  <a href="https://devsponsors.github.io/mediakit.html"><img src="https://img.shields.io/badge/Infrastructure-DevSponsors_Cloud-ec4899?style=for-the-badge&logo=server" alt="DevSponsors Cloud"></a>
</p>

# دعوت‌نامه‌ساز | ساخت دعوت‌نامه آنلاین

استودیوی مرورگری ساخت کارت دعوت: تصویر خودتان را می‌گذارید، نام‌ها را وارد می‌کنید و همه کارت‌ها را یک‌جا دانلود می‌کنید. هیچ فایلی آپلود نمی‌شود و هیچ سروری در کار نیست؛ کل پردازش تصویر با Canvas روی دستگاه خودتان انجام می‌شود.

**نسخه زنده:** https://m4tinbeigi-official.github.io/Event-invitation/

## چه چیزی نسبت به نسخه قبل عوض شد

- **پیش‌نمایش زنده**: هر تغییر (نام، رنگ، اندازه، موقعیت) همان لحظه روی کارت دیده می‌شود؛ دکمه «پیش‌نمایش» حذف شد.
- **جابه‌جایی با ماوس**: متن را مستقیم روی کارت بکشید. با کلیدهای جهت‌دار هم می‌شود (Shift برای گام بزرگ‌تر). موقعیت بر حسب درصد ذخیره می‌شود، پس برای هر ابعاد تصویری درست کار می‌کند.
- **جا شدن خودکار متن**: نام‌های بلند خودکار کوچک و شکسته می‌شوند تا از کارت بیرون نزنند.
- **خروجی دسته‌ای واقعی**: همه کارت‌ها در یک فایل ZIP با ساختار استاندارد UTF-8 بسته‌بندی می‌شوند. نسخه قبلی برای هر نام یک دانلود جدا صدا می‌زد که مرورگرها بعد از فایل اول بلاک می‌کردند.
- **قالب و کیفیت خروجی**: JPG با کیفیت قابل تنظیم یا PNG بدون افت کیفیت، در ابعاد اصلی تصویر.
- **قلم تضمین‌شده**: وزیرمتن به‌صورت لوکال همراه پروژه می‌آید و پیش از رسم روی Canvas صریحا بارگذاری می‌شود. قبلا قلم از یک CDN خارجی خوانده می‌شد و اگر در دسترس نبود، متن با قلم جایگزین رندر می‌شد.
- **پیشوند دستی واقعا کار می‌کند**: حالت‌های خودکار، در متن نام، و بدون پیشوند. در نسخه قبل گزینه «دستی» هیچ اثری نداشت.
- **سطر بالا و پایین**: عنوان رویداد و سطر تاریخ یا مکان با اندازه مستقل.
- **حاشیه دور متن**: برای خوانایی روی عکس‌های شلوغ.
- **دسترس‌پذیری و RTL**: کل چیدمان با ویژگی‌های منطقی، گروه‌های رادیویی داخل fieldset، وضعیت‌های focus، اعلان‌های aria-live، و نسبت کنتراست AA.
- **حفظ تنظیمات**: نام‌ها و تنظیمات در localStorage می‌مانند و با رفرش از بین نمی‌روند.
- **نصب‌شدنی**: manifest و آیکون SVG برای افزودن به صفحه اصلی.
- **سئو**: متاتگ‌های مطلق Open Graph، canonical و داده ساختاریافته WebApplication.

## ویژگی‌ها

- بارگذاری تصویر با کلیک یا drag و drop، با اعتبارسنجی نوع و حجم (تا ۱۵ مگابایت).
- فهرست جداگانه آقایان و خانم‌ها با پیشوند خودکار «جناب آقای» و «سرکار خانم» (قابل ویرایش).
- انتخاب قلم، رنگ (پالت آماده و رنگ دلخواه)، اندازه، فاصله سطرها و پهنای مجاز متن.
- تراز راست، وسط و چپ با در نظر گرفتن جهت راست‌به‌چپ.
- ناوبری بین نام‌ها با تراشه‌ها برای بازبینی تک‌تک کارت‌ها.
- دانلود کارت جاری یا دانلود همه، با نوار پیشرفت واقعی.
- میان‌بر `Ctrl/Cmd + Enter` برای دانلود همه.

## اجرای محلی

```bash
git clone https://github.com/m4tinbeigi-official/Event-invitation.git
cd Event-invitation
python3 -m http.server 8080
```

سپس http://localhost:8080 را باز کنید. هیچ مرحله build و هیچ وابستگی‌ای لازم نیست.

## ساختار پروژه

```
index.html              ساختار صفحه و متاتگ‌ها
styles.css              استایل RTL با توکن‌های طراحی
script.js               موتور رندر Canvas، جابه‌جایی، خروجی ZIP
icon.svg                آیکون برداری
manifest.webmanifest    تنظیمات PWA
assets/fonts/           وزیرمتن (woff2) به‌صورت لوکال
default-image-yektanet.jpg  تصویر پیش‌فرض
```

## نکات فنی

- چیدمان متن روی بوم با محاسبه پهنای واقعی هر سطر انجام می‌شود؛ متن تا جا شدن کوچک می‌شود و در صورت نیاز روی مرز واژه‌ها می‌شکند.
- نویسنده ZIP بدون کتابخانه نوشته شده (روش store، با CRC32 و پرچم UTF-8) تا پروژه صفر وابستگی بماند.
- خروجی برای تصاویر بسیار بزرگ تا ۴۲۰۰ پیکسل روی ضلع بزرگ‌تر مقیاس می‌شود تا از محدودیت حافظه مرورگر رد نشود.
- در تب پس‌زمینه که requestAnimationFrame اجرا نمی‌شود، رسم به‌صورت همگام انجام می‌شود.

## ارتباط

- ایمیل: [m4tinbeigi@gmail.com](mailto:m4tinbeigi@gmail.com)

## شبکه‌های اجتماعی

- [GitHub](https://github.com/m4tinbeigi-official/)
- [Twitter](https://twitter.com/m4tinbeigi)
- [Instagram](https://www.instagram.com/m4tinbeigi)
- [LinkedIn](https://linkedin.com/in/matinbeigi)

## لایسنس

MIT

---

این پروژه با ♥ توسط [ریک سانچز](https://github.com/m4tinbeigi-official) ساخته شده است.
