<div align="center">

# 15 стилей моушн-дизайна

**Пятнадцать стилей, по одному 10-секундному ролику на каждый. Все сделаны Claude Opus 5.5, который писал код.**

К каждому ролику прилагаются описание стиля, полный промт и весь исходный код.

<a href="https://vincentwei1021.github.io/mg-styles-15/"><img src="docs/readme/cover.webp" width="100%" alt="15 стилей моушн-дизайна: все пятнадцать роликов рядом"></a>

[**▶ Смотреть все 15 роликов со звуком**](https://vincentwei1021.github.io/mg-styles-15/)

**Русский** | [简体中文](README.zh-CN.md)

![films](https://img.shields.io/badge/films-15-ff8a3d) ![length](https://img.shields.io/badge/length-10%20s%20each-555) ![made with](https://img.shields.io/badge/made%20with-Claude%20Opus%205.5-d97757) [![license](https://img.shields.io/badge/license-MIT-blue)](LICENSE) [![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-live-2ea44f)](https://vincentwei1021.github.io/mg-styles-15/)

</div>

## Что это

Пятнадцать 10-секундных моушн-роликов, каждый в своём стиле: от покадровой рисованной анимации до вертикального монтажа в духе развлекательного шоу. Каждый ролик Claude Opus 5.5 сделал, написав код по промту: картинку, анимацию, музыку и звуковые эффекты. В репозитории выложено всё это целиком, так что можно посмотреть стиль, прочитать, как он сделан, скопировать промт и снять свой ролик.

- **Никакой генерации картинок или видео.** Картинка - это код: SVG, Canvas, WebGL и Three.js, а для 3D-ролика - Blender. В нескольких роликах использованы фотографии с лицензией CC0 или из общественного достояния.
- **Звук - тоже код.** Скрипт `audio.py` каждого ролика синтезирует музыку и звуковые эффекты. Все 15 саундтреков собраны из 103 записанных сэмплов инструментов.
- **Выложено всё.** Ролик, описание стиля, полный промт и весь исходный код - для всех 15 стилей.

## Как делается ролик

<p align="center"><img src="docs/readme/flow-en.webp" width="100%" alt="Как делается ролик: один промт на стиль, Claude пишет ролик как веб-страницу, которая умеет нарисовать любой момент, невидимый Chrome рендерит каждый кадр, audio.py синтезирует музыку и эффекты по тем же меткам, ffmpeg собирает ровно 10-секундный MP4, а второй ИИ проверяет его по rubric.md в два круга правок"></p>

Каждый ролик - это веб-страница, которая рисует кадр для любого заданного момента времени (`window.renderAt(t)`). Рендерер снимает каждый кадр в невидимом (headless) Chrome, а ffmpeg склеивает кадры и саундтрек. Единственное исключение - 3D-ролик: его картинку рендерит Blender, а веб-страница добавляет текст и зерно. Каждый ролик прошёл два круга проверки и доработки. Итоговые оценки ИИ-жюри - от 7,57 до 8,21 из 10.

## 15 стилей

Нажми на ролик, чтобы посмотреть его со звуком на странице.

<table>
<tr>
<td align="center" valign="top" width="33%"><a href="https://vincentwei1021.github.io/mg-styles-15/#05-cel-boil"><img src="docs/readme/films/05-cel-boil.webp" width="100%" alt="Покадровая анимация: HAND MADE"></a><br><b>01 · Покадровая анимация / «дрожащая» линия</b><br><sub>HAND MADE</sub><br><sub><a href="prompts/05-cel-boil.md">Промт</a> · <a href="demos/05-cel-boil">Код</a></sub></td>
<td align="center" valign="top" width="33%"><a href="https://vincentwei1021.github.io/mg-styles-15/#03-isometric"><img src="docs/readme/films/03-isometric.webp" width="100%" alt="Изометрия 2.5D: ISOPOLIS - Let the City Grow"></a><br><b>02 · Изометрия 2.5D</b><br><sub>ISOPOLIS - Let the City Grow</sub><br><sub><a href="prompts/03-isometric.md">Промт</a> · <a href="demos/03-isometric">Код</a></sub></td>
<td align="center" valign="top" width="33%"><a href="https://vincentwei1021.github.io/mg-styles-15/#01-flat-vector"><img src="docs/readme/films/01-flat-vector.webp" width="100%" alt="Плоский вектор: popwise - One Dot"></a><br><b>03 · Плоский вектор</b><br><sub>popwise - One Dot</sub><br><sub><a href="prompts/01-flat-vector.md">Промт</a> · <a href="demos/01-flat-vector">Код</a></sub></td>
</tr>
<tr>
<td align="center" valign="top" width="33%"><a href="https://vincentwei1021.github.io/mg-styles-15/#02-line-art"><img src="docs/readme/films/02-line-art.webp" width="100%" alt="Рисунок линией: ATELIER LINEA - One Line"></a><br><b>04 · Рисунок линией</b><br><sub>ATELIER LINEA - One Line</sub><br><sub><a href="prompts/02-line-art.md">Промт</a> · <a href="demos/02-line-art">Код</a></sub></td>
<td align="center" valign="top" width="33%"><a href="https://vincentwei1021.github.io/mg-styles-15/#04-3d-render"><img src="docs/readme/films/04-3d-render.webp" width="100%" alt="3D-рендер: soft. - Soft Landing"></a><br><b>05 · 3D-рендер</b><br><sub>soft. - Soft Landing · в духе C4D / Blender</sub><br><sub><a href="prompts/04-3d-render.md">Промт</a> · <a href="demos/04-3d-render">Код</a></sub></td>
<td align="center" valign="top" width="33%"><a href="https://vincentwei1021.github.io/mg-styles-15/#08-morph"><img src="docs/readme/films/08-morph.webp" width="100%" alt="Морфинг фигур: morphe. - One Shape, Every Story"></a><br><b>06 · Морфинг фигур</b><br><sub>morphe. - One Shape, Every Story</sub><br><sub><a href="prompts/08-morph.md">Промт</a> · <a href="demos/08-morph">Код</a></sub></td>
</tr>
<tr>
<td align="center" valign="top" width="33%"><a href="https://vincentwei1021.github.io/mg-styles-15/#19-paperclip"><img src="docs/readme/films/19-paperclip.webp" width="100%" alt="Объяснялка со стикерами: How Many Elements Hide in a Phone?"></a><br><b>07 · Объяснялка со стикерами</b><br><sub>How Many Elements Hide in a Phone?</sub><br><sub><a href="prompts/19-paperclip.md">Промт</a> · <a href="demos/19-paperclip">Код</a></sub></td>
<td align="center" valign="top" width="33%"><a href="https://vincentwei1021.github.io/mg-styles-15/#22-hud"><img src="docs/readme/films/22-hud.webp" width="100%" alt="Киберпанк-интерфейс HUD / FUI: KESTREL-9 · Target Acquired"></a><br><b>08 · Киберпанк-интерфейс HUD / FUI</b><br><sub>KESTREL-9 · Target Acquired</sub><br><sub><a href="prompts/22-hud.md">Промт</a> · <a href="demos/22-hud">Код</a></sub></td>
<td align="center" valign="top" width="33%"><a href="https://vincentwei1021.github.io/mg-styles-15/#06-collage"><img src="docs/readme/films/06-collage.webp" width="100%" alt="Коллаж из вырезок: NOGGIN Quarterly"></a><br><b>09 · Коллаж из вырезок</b><br><sub>NOGGIN Quarterly</sub><br><sub><a href="prompts/06-collage.md">Промт</a> · <a href="demos/06-collage">Код</a></sub></td>
</tr>
<tr>
<td align="center" valign="top" width="33%"><a href="https://vincentwei1021.github.io/mg-styles-15/#12-aurora-glass"><img src="docs/readme/films/12-aurora-glass.webp" width="100%" alt="Северное сияние и стекло: Aurora - Think in Light"></a><br><b>10 · Северное сияние и стекло</b><br><sub>Aurora - Think in Light</sub><br><sub><a href="prompts/12-aurora-glass.md">Промт</a> · <a href="demos/12-aurora-glass">Код</a></sub></td>
<td align="center" valign="top" width="33%"><a href="https://vincentwei1021.github.io/mg-styles-15/#09-bauhaus"><img src="docs/readme/films/09-bauhaus.webp" width="100%" alt="Геометрический Баухаус: KONSTRUKTION · 20 Beats"></a><br><b>11 · Геометрический Баухаус</b><br><sub>KONSTRUKTION · 20 Beats</sub><br><sub><a href="prompts/09-bauhaus.md">Промт</a> · <a href="demos/09-bauhaus">Код</a></sub></td>
<td align="center" valign="top" width="33%"><a href="https://vincentwei1021.github.io/mg-styles-15/#10-synthwave"><img src="docs/readme/films/10-synthwave.webp" width="100%" alt="Синтвейв 80-х / VHS: NEON DRIVE - Midnight 1986"></a><br><b>12 · Синтвейв 80-х / VHS</b><br><sub>NEON DRIVE - Midnight 1986</sub><br><sub><a href="prompts/10-synthwave.md">Промт</a> · <a href="demos/10-synthwave">Код</a></sub></td>
</tr>
<tr>
<td align="center" valign="top" width="33%"><a href="https://vincentwei1021.github.io/mg-styles-15/#20-pixel"><img src="docs/readme/films/20-pixel.webp" width="100%" alt="Пиксель-арт: PIXEL QUEST"></a><br><b>13 · Пиксель-арт</b><br><sub>PIXEL QUEST</sub><br><sub><a href="prompts/20-pixel.md">Промт</a> · <a href="demos/20-pixel">Код</a></sub></td>
<td align="center" valign="top" width="33%"><a href="https://vincentwei1021.github.io/mg-styles-15/#07-liquid"><img src="docs/readme/films/07-liquid.webp" width="100%" alt="Жидкая анимация: drop. - It All Starts with a Drop"></a><br><b>14 · Жидкая анимация</b><br><sub>drop. - It All Starts with a Drop</sub><br><sub><a href="prompts/07-liquid.md">Промт</a> · <a href="demos/07-liquid">Код</a></sub></td>
<td align="center" valign="top" width="33%"><a href="https://vincentwei1021.github.io/mg-styles-15/#18-hanazi"><img src="docs/readme/films/18-hanazi.webp" width="100%" alt="Титры как в шоу: Miaowu Diary EP.07 · вертикаль 9:16"></a><br><b>15 · Титры как в развлекательном шоу</b><br><sub>Miaowu Diary EP.07 · вертикаль 9:16</sub><br><sub><a href="prompts/18-hanazi.md">Промт</a> · <a href="demos/18-hanazi">Код</a></sub></td>
</tr>
</table>

На странице у каждого стиля свой раздел: ролик, что это за стиль и как сделан этот ролик. Ниже одним нажатием открывается полный промт или просмотр всех файлов исходного кода. Страница переключается между английским и китайским.

[![Страница-витрина: покадровый ролик рядом с описанием стиля, ниже открыт промт](docs/screenshot-en.jpg)](https://vincentwei1021.github.io/mg-styles-15/)

## Как сделать ролик по промту

1. Открой ИИ-помощника, который умеет писать код и запускать команды (например, Claude Code), в пустой папке. На компьютере должны быть Node, Chrome и ffmpeg. Для 3D-стиля рекомендуемый способ использует Blender.
2. Открой любой файл в папке `prompts/` и отправь весь блок промта целиком.
3. Чтобы сделать ролик своим: конкретная история есть только в разделе `Creative seed`. Замени в нём историю, название бренда, тексты и цвета на свои. Или поменяй `Output` на вертикальный формат 1080×1920 или другую длину. Раздел `Signature features` не трогай: именно по нему стиль узнаётся с первого взгляда.
4. Чтобы довести до уровня выше: когда ролик готов, дай второму ИИ проверить его по [rubric.md](rubric.md) и вставь отзыв обратно для ещё одного круга. Оригинальные ролики прошли цикл «сделать → проверить → доработать» дважды.
5. Чтобы написать новый стиль: заполни четыре раздела в [template.md](template.md) (параметры вывода, технический способ, творческая идея, фирменные черты), а общие части скопируй как есть.

Чтобы сэкономить усилия, можно также указать ИИ на `harness/render.mjs` из этого репозитория для рендера и на `lib/audio` для саундтрека, вместо того чтобы делать и то, и другое с нуля.

## Как запустить исходный код

| Что нужно | Для чего | Как поставить |
|---|---|---|
| Node.js 22.12 или новее | Рендерер и npm-пакеты роликов | [nodejs.org](https://nodejs.org), затем `npm install` |
| Google Chrome | Невидимая съёмка кадров | На macOS находится в стандартном месте сам; в остальных случаях задай `MG_CHROME=<путь>` |
| ffmpeg | Склейка картинки и звука | `brew install ffmpeg` или `sudo apt install ffmpeg` |
| Python 3.11 или новее | Саундтреки (`audio.py`) и скрипты для материалов | `pip install -r requirements.txt` |
| Blender | Только для 3D-ролика | [demos/04-3d-render/README.md](demos/04-3d-render/README.md) |
| Шрифты | Надписи как в роликах | В репозитории их нет; список - в [assets/fonts/README.md](assets/fonts/README.md) |

```bash
# из корня репозитория
npm install
pip install -r requirements.txt
python3 demos/01-flat-vector/audio.py          # саундтрек → demos/01-flat-vector/out/audio.wav
node harness/render.mjs demos/01-flat-vector   # рендер всех кадров → demos/01-flat-vector/out/video.mp4
python3 -m http.server 8000                    # превью: http://localhost:8000/harness/preview.html?demo=01-flat-vector
```

- Запускай сервер из корня репозитория: пути внутри роликов (`/assets/...`, `/node_modules/...`) указаны относительно него.
- Картинка 3D-ролика - это последовательность кадров, отрендеренных в Blender; шаги описаны в [demos/04-3d-render/README.md](demos/04-3d-render/README.md).

## Что лежит в репозитории

| Путь | Содержимое |
|---|---|
| `index.html`, `site/` | Страница-витрина: ролик, описание, промт и просмотр кода для каждого стиля, на английском и китайском |
| `videos/` | 15 роликов и их обложки. 8 выложены в исходном виде; остальные 7 весили 37-100 Мбит/с, это слишком тяжело для просмотра в браузере, поэтому их перекодировали в H.264 до 28 Мбит/с |
| `prompts/` | По одному полному промту на стиль, с инструкцией (инструкции на китайском; сами промты на английском, с описанием стиля на китайском) |
| `demos/<название>/` | Исходный код каждого ролика: код картинки (`index.html` и JS), скрипт саундтрека `audio.py`, таблица таймингов `cues.json` и скрипты, которые создали материалы ролика |
| `harness/render.mjs` | Рендерер: снимает каждый кадр в невидимом Chrome, затем склеивает видео и звук через ffmpeg |
| `harness/preview.html` | Прокрутка любого ролика в браузере |
| `lib/audio/` | mgaudio - набор инструментов, который синтезирует музыку и звуковые эффекты, плюс 103 сэмпла инструментов для 15 саундтреков |
| `assets/` | Общие текстуры и HDRI для роликов; список шрифтов (самих файлов шрифтов в репозитории нет) |
| `rubric.md`, `template.md` | Промт для проверки; шаблон, чтобы написать промт для нового стиля |
| `docs/` | Картинки для этого README: обложка, схема, превью роликов и скриншоты страницы |

## Как развернуть свою копию сайта

1. Сделай форк этого репозитория или загрузи все его файлы (включая `.nojekyll`) в ветку `main` своего репозитория. Самый большой файл весит 38 МБ - меньше лимита GitHub в 100 МБ на файл, так что Git LFS не нужен.
2. В репозитории открой Settings → Pages → Build and deployment, выбери Deploy from a branch, ветку `main`, папку `/ (root)`. На бесплатном аккаунте Pages работает только для публичных репозиториев.
3. Через минуту-две открой `https://<пользователь>.github.io/<репозиторий>/`. Страница сама определяет репозиторий, поэтому кнопка «Open on GitHub» ведёт на нужный файл. Если используешь свой домен, впиши адрес репозитория в `<meta name="repo">` в `index.html`.

Сайт весит около 575 МБ, из них 420 МБ - видео. GitHub Pages разрешает 1 ГБ на сайт и мягкий лимит 100 ГБ трафика в месяц; видео скачиваются только при просмотре.

## Полезно знать

- Файлов шрифтов в репозитории нет: у них разные лицензии, а китайские шрифты очень большие. В [assets/fonts/README.md](assets/fonts/README.md) написано, какие нужны и куда их положить. Без них браузер подставит системные шрифты, и надписи будут выглядеть не так, как в роликах.
- Один и тот же промт каждый раз даёт новый ролик. Каждый оригинальный ролик прошёл несколько кругов доработки; с одного запуска обычно не получается такого же результата.
- Скрипты саундтреков детерминированы: при повторном запуске в той же среде они каждый раз дают один и тот же результат. С версиями из `requirements.txt` 4 саундтрека совпадают со звуком роликов (с точностью до младшего бита), а остальные 11 местами отличаются - вероятно, из-за изменений в математических библиотеках.
- Для своих роликов используй только материалы, разрешённые для коммерческого использования (CC0, OFL и подобные). Промты уже просят об этом.

## Лицензия

- Код, промты, документация и ролики, сделанные для этого проекта, выпущены под [лицензией MIT](LICENSE).
- Сторонние файлы сохраняют свои лицензии. Сэмплы инструментов (VCSL), HDRI, текстура бумаги, фотографии и картографические данные HUD-ролика (Natural Earth) - CC0 или общественное достояние. `site/vendor/highlight.min.js` - под BSD-3-Clause ([её лицензия](site/vendor/highlight.LICENSE)). Контуры букв в `demos/04-3d-render/assets/mesh/` и `demos/08-morph/glyphs.json` взяты из шрифтов под SIL Open Font License и остаются под ней.
- Файлов шрифтов в репозитории нет, они сохраняют свои лицензии; список - в [assets/fonts/README.md](assets/fonts/README.md).

## Об авторе

Сделано [Vincentwei1021](https://github.com/Vincentwei1021) вместе с Claude Opus 5.5. Страница - https://vincentwei1021.github.io/mg-styles-15/, репозиторий - https://github.com/Vincentwei1021/mg-styles-15. Если используешь эти промты или код, ссылка на оригинал будет приятна автору.
