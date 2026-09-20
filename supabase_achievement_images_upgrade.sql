-- Replace the nine light-background achievement images with transparent assets.
-- Map class 9 intentionally keeps its existing image.

begin;

update public.achievement_catalog
set image_url = case id
  when 'map-class-6' then 'https://res.cloudinary.com/de513yqvf/image/upload/v1788840350/Danh_hi%E1%BB%87u_sinh_h%E1%BB%8Dc_l%E1%BB%9Bp_6-Photoroom_b7dno9.png'
  when 'map-class-7' then 'https://res.cloudinary.com/de513yqvf/image/upload/v1788840352/Danh_hi%E1%BB%87u_ho%C3%A0n_th%C3%A0nh_map_sinh_h%E1%BB%8Dc_l%E1%BB%9Bp_7-Photoroom_nwzkqp.png'
  when 'map-class-8' then 'https://res.cloudinary.com/de513yqvf/image/upload/v1788840351/Danh_hi%E1%BB%87u_ho%C3%A0n_th%C3%A0nh_Map_Sinh_h%E1%BB%8Dc_l%E1%BB%9Bp_8-Photoroom_u6xnpl.png'
  when 'map-class-10' then 'https://res.cloudinary.com/de513yqvf/image/upload/v1788840350/Danh_hi%E1%BB%87u_ho%C3%A0n_th%C3%A0nh_Map_sinh_h%E1%BB%8Dc_l%E1%BB%9Bp_10-Photoroom_izdsaz.png'
  when 'map-class-11' then 'https://res.cloudinary.com/de513yqvf/image/upload/v1788840554/Danh_hi%E1%BB%87u_ho%C3%A0n_th%C3%A0nh_Map_Sinh_h%E1%BB%8Dc_11-Photoroom_c38ohx.png'
  when 'map-class-12' then 'https://res.cloudinary.com/de513yqvf/image/upload/v1788840551/Danh_hi%E1%BB%87u_ho%C3%A0n_th%C3%A0nh_Map_Sinh_h%E1%BB%8Dc_12-Photoroom_rowlas.png'
  when 'bio-diversity-day' then 'https://res.cloudinary.com/de513yqvf/image/upload/v1788840352/Danh_hi%E1%BB%87u_Ng%C3%A0y_Qu%E1%BB%91c_t%E1%BA%BF_%C4%90a_d%E1%BA%A1ng_Sinh_h%E1%BB%8Dc-Photoroom_kez1kj.png'
  when 'teachers-day' then 'https://res.cloudinary.com/de513yqvf/image/upload/v1788840351/Danh_hi%E1%BB%87u_%C4%91%E1%BA%B7c_bi%E1%BB%87t_2011-Photoroom_avbelo.png'
  when 'one-year' then 'https://res.cloudinary.com/de513yqvf/image/upload/v1788840356/Danh_hi%E1%BB%87u_th%C3%A0nh_t%E1%BB%B1u_k%E1%BB%B7_ni%E1%BB%87m_1_n%C4%83m-Photoroom_xh6bku.png'
  else image_url
end,
updated_at = now()
where id in (
  'map-class-6', 'map-class-7', 'map-class-8',
  'map-class-10', 'map-class-11', 'map-class-12',
  'bio-diversity-day', 'teachers-day', 'one-year'
);

commit;

select id, image_url
from public.achievement_catalog
order by sort_order;
