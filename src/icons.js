// Hand-drawn UI icons (SVG, same outline/pastel style as the menu art). Used instead of emoji,
// which render differently per device (iOS turns ↗ ▶ ↩ ♥ ⚙ into colour emoji).
export const ICON_NAMES=['arrow','ball','bell','brush','hand','home','link','play','popper','sound-off','sound-on'];
export const iconSrc=name=>`./Asset/ui/icons/${name}.svg`;
export const icon=(name,cls='ui-icon')=>`<img class="${cls}" src="${iconSrc(name)}" alt="" aria-hidden="true" draggable="false">`;
export function iconEl(name,cls='ui-icon'){const img=document.createElement('img');img.className=cls;img.src=iconSrc(name);img.alt='';img.setAttribute('aria-hidden','true');img.draggable=false;return img;}
