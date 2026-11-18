import { StoryConfig } from '../types/zonak';
import { toArabicDigits } from '../data/initialData';

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  const words = text.split(' ');
  let line = '';
  let currentY = y;

  for (let i = 0; i < words.length; i++) {
    const testLine = line + (line ? ' ' : '') + words[i];
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && line) {
      ctx.fillText(line, x, currentY);
      line = words[i];
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  if (line) {
    ctx.fillText(line, x, currentY);
  }
}

export async function renderStoryToPngBlob(
  config: StoryConfig,
  stats: { completedSteps: number; restHours: number; recoveryDays: number; peacePct: number }
): Promise<Blob | null> {
  const width = 1080;
  const height = 1920;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.direction = 'rtl';

  // Background gradient per theme
  const grad = ctx.createLinearGradient(0, 0, width, height);
  if (config.theme === 'warm_sunrise') {
    grad.addColorStop(0, '#FFF5D6');
    grad.addColorStop(0.45, '#FCF8EE');
    grad.addColorStop(1, '#F5EFE0');
  } else if (config.theme === 'calm_wave') {
    grad.addColorStop(0, '#DFEEFC');
    grad.addColorStop(0.5, '#F2F7FC');
    grad.addColorStop(1, '#E8F2F8');
  } else {
    grad.addColorStop(0, '#FFFFFF');
    grad.addColorStop(1, '#F6F4EE');
  }

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // Header badge + brand
  ctx.fillStyle = '#0A467E';
  ctx.font = 'bold 54px "Readex Pro", "IBM Plex Sans Arabic", sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('زونك', width - 90, 145);

  ctx.fillStyle = '#6B7280';
  ctx.font = '500 32px "IBM Plex Sans Arabic", sans-serif';
  ctx.fillText('Zonak', width - 245, 145);

  // Top left pill
  ctx.fillStyle = config.theme === 'calm_wave' ? '#D6ECFC' : '#F6D86B';
  roundRect(ctx, 84, 92, 320, 74, 37);
  ctx.fill();
  ctx.fillStyle = '#1E293B';
  ctx.font = 'bold 30px "IBM Plex Sans Arabic", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('أسبوع عدّى بروقان 🍃', 244, 139);

  // Hero card
  ctx.save();
  ctx.shadowColor = 'rgba(10, 70, 126, 0.06)';
  ctx.shadowBlur = 32;
  ctx.shadowOffsetY = 10;
  ctx.fillStyle = '#FFFFFF';
  roundRect(ctx, 76, 225, width - 152, 340, 44);
  ctx.fill();
  ctx.restore();

  // Warm illustration placeholder circle inside hero card
  const artGrad = ctx.createLinearGradient(width - 370, 260, width - 110, 520);
  artGrad.addColorStop(0, '#FBE2B4');
  artGrad.addColorStop(1, '#F6B885');
  ctx.fillStyle = artGrad;
  roundRect(ctx, width - 376, 262, 264, 264, 32);
  ctx.fill();

  // Cozy tea cup inside illustration
  ctx.fillStyle = '#FFFFFF';
  ctx.beginPath();
  ctx.arc(width - 244, 405, 58, 0, Math.PI * 2);
  ctx.fill();
  ctx.font = '72px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('☕', width - 244, 428);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#9A6E18';
  ctx.font = 'bold 28px "IBM Plex Sans Arabic", sans-serif';
  ctx.fillText('مزاج الأسبوع • رايق جداً', width - 414, 328);

  ctx.fillStyle = '#1A2230';
  ctx.font = 'bold 46px "Readex Pro", "IBM Plex Sans Arabic", sans-serif';
  drawWrappedText(
    ctx,
    'أسبوعي مكنش سباق.. أسبوعي كان روقان حقيقي ☕💛',
    width - 414,
    395,
    530,
    66
  );

  let cursorY = 605;

  // 2x2 Stats Grid
  if (config.showNumbers) {
    const cards = [
      {
        label: 'إنجاز هادي',
        value: `${toArabicDigits(stats.completedSteps)} خطوات`,
        desc: 'صغيرة تمت بروقان ودون حرق دم ☕',
        accent: '#A17C1A',
      },
      {
        label: 'شحن طاقة',
        value: `${toArabicDigits(stats.restHours)} ساعة`,
        desc: 'راحة مستحقة وتجديد شغف حقيقي 🛋️',
        accent: '#0A467E',
      },
      {
        label: 'فصلان معتمد',
        value: stats.recoveryDays === 2 ? 'يومين' : `${toArabicDigits(stats.recoveryDays)} أيام`,
        desc: 'فرهدة معتمدة بدون أي تأنيب ضمير 🔋',
        accent: '#9F2B1D',
      },
      {
        label: 'سلام داخلي',
        value: 'هادي ورايق',
        desc: 'هدوء نفسي وسكينة بدون دوشة ☁️',
        accent: '#8B7415',
      },
    ];

    const cardW = (width - 152 - 30) / 2;
    const cardH = 260;

    cards.forEach((c, idx) => {
      const col = idx % 2;
      const row = Math.floor(idx / 2);
      const x = col === 0 ? width - 76 - cardW : 76;
      const y = cursorY + row * (cardH + 28);

      ctx.fillStyle = '#FFFFFF';
      roundRect(ctx, x, y, cardW, cardH, 36);
      ctx.fill();

      ctx.textAlign = 'left';
      ctx.fillStyle = c.accent;
      ctx.font = 'bold 26px "IBM Plex Sans Arabic", sans-serif';
      ctx.fillText(c.label, x + 36, y + 62);

      ctx.textAlign = 'right';
      ctx.fillStyle = '#1A2230';
      ctx.font = 'bold 46px "Readex Pro", "IBM Plex Sans Arabic", sans-serif';
      ctx.fillText(c.value, x + cardW - 36, y + 132);

      ctx.fillStyle = '#6B7280';
      ctx.font = '400 26px "IBM Plex Sans Arabic", sans-serif';
      drawWrappedText(ctx, c.desc, x + cardW - 36, y + 184, cardW - 72, 38);
    });

    cursorY += cardH * 2 + 64;
  }

  // Mood chart card
  if (config.showChart) {
    ctx.fillStyle = '#FFFFFF';
    roundRect(ctx, 76, cursorY, width - 152, 165, 36);
    ctx.fill();

    ctx.textAlign = 'right';
    ctx.fillStyle = '#6B7280';
    ctx.font = '500 26px "IBM Plex Sans Arabic", sans-serif';
    ctx.fillText('مؤشر الانبساط خلال ٧ أيام', width - 114, cursorY + 62);

    ctx.fillStyle = '#1A2230';
    ctx.font = 'bold 34px "Readex Pro", "IBM Plex Sans Arabic", sans-serif';
    ctx.fillText('منحنى صاعد بلا ضغوطات 📈', width - 114, cursorY + 114);

    // Smooth curve on the left side
    ctx.strokeStyle = '#0A467E';
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(120, cursorY + 115);
    ctx.bezierCurveTo(210, cursorY + 125, 250, cursorY + 60, 320, cursorY + 85);
    ctx.bezierCurveTo(370, cursorY + 102, 410, cursorY + 45, 455, cursorY + 55);
    ctx.stroke();

    ctx.fillStyle = '#F6D258';
    ctx.beginPath();
    ctx.arc(455, cursorY + 55, 13, 0, Math.PI * 2);
    ctx.fill();

    cursorY += 200;
  }

  // Quote banner
  ctx.fillStyle = '#0A467E';
  roundRect(ctx, 76, cursorY, width - 152, 230, 40);
  ctx.fill();

  ctx.textAlign = 'right';
  ctx.fillStyle = '#F6D258';
  ctx.font = 'bold 52px serif';
  ctx.fillText('❝', width - 116, cursorY + 84);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 34px "IBM Plex Sans Arabic", sans-serif';
  drawWrappedText(
    ctx,
    'إنتاجيتي مش مقياس قيمتي كإنسان.. الراحة استثمار حقيقي، والأيام الحلوة بتتعاش ببال رايق ودون مقارنات.',
    width - 178,
    cursorY + 84,
    width - 295,
    56
  );

  // Footer
  ctx.textAlign = 'right';
  ctx.fillStyle = '#4B5563';
  ctx.font = '600 28px "IBM Plex Sans Arabic", sans-serif';
  ctx.fillText('تطبيق زونك • رفيق الروقان ☀️', width - 110, height - 110);

  ctx.fillStyle = '#E5E7EB';
  roundRect(ctx, 84, height - 148, 260, 56, 18);
  ctx.fill();
  ctx.textAlign = 'center';
  ctx.fillStyle = '#4B5563';
  ctx.font = '600 26px monospace';
  ctx.fillText('#zonak_weekly', 214, height - 110);

  // Stickers overlay
  for (const s of config.stickers) {
    if (!s.visible) continue;
    const cx = (s.x / 100) * width;
    const cy = (s.y / 100) * height;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate((s.rotation * Math.PI) / 180);
    ctx.scale(s.scale, s.scale);

    ctx.font = 'bold 34px "IBM Plex Sans Arabic", sans-serif';
    const textW = ctx.measureText(s.text).width;
    const pillW = Math.max(220, textW + 84);
    const pillH = 84;

    ctx.shadowColor = 'rgba(0,0,0,0.12)';
    ctx.shadowBlur = 22;
    ctx.shadowOffsetY = 8;
    ctx.fillStyle = s.bgColor;
    roundRect(ctx, -pillW / 2, -pillH / 2, pillW, pillH, 42);
    ctx.fill();

    ctx.shadowColor = 'transparent';
    ctx.fillStyle = s.textColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(s.text, 0, 2);
    ctx.restore();
  }

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png');
  });
}
