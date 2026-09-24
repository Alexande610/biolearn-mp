-- Hint-only review. Run after the V2 base migration. Do not auto-publish.
-- Draft/review releases: replace only unchanged placeholder hints.
-- Published releases: clone current database content to a new review version,
-- preserving admin edits, answers, source references, and the live publication.
do $station_hints$
declare
  v_base record;
  v_new_id uuid;
  v_admin_id uuid;
  v_changed integer;
begin
  create temporary table station_hint_review_values (
    base_version text not null,
    day_index integer not null,
    game_type text not null,
    hint text not null,
    expected_content jsonb not null,
    primary key(base_version, day_index, game_type)
  ) on commit drop;
  insert into station_hint_review_values values
  ('g6-st1-2026.1', 1, 'match', '“Thị kính” tương ứng với “Nơi đặt mắt để quan sát”.', '{"leftItems":["Thị kính","Vật kính","Ốc điều chỉnh"],"rightItems":["Điều chỉnh khoảng cách để ảnh rõ","Phóng đại ảnh của vật","Nơi đặt mắt để quan sát"]}'::jsonb),
  ('g6-st1-2026.1', 1, 'fill', 'Từ cần điền gồm 2 tiếng và bắt đầu bằng chữ “n”.', '{"sentence":"Kính hiển vi quang học giúp quan sát những vật có kích thước [blank] mà mắt thường khó thấy."}'::jsonb),
  ('g6-st1-2026.1', 1, 'category', '“Thị kính” thuộc nhóm “Bộ phận quang học”.', '{"categories":["Bộ phận quang học","Bộ phận cơ học"],"items":["Thị kính","Vật kính","Bàn kính","Ốc điều chỉnh"]}'::jsonb),
  ('g6-st1-2026.1', 1, 'dragdrop', 'Từ cần chọn gồm 3 tiếng và bắt đầu bằng chữ “ố”.', '{"textWithBlanks":"Sau khi đặt tiêu bản, cần điều chỉnh [blank] để ảnh quan sát rõ nét.","bankWords":["ốc điều chỉnh","chân kính","kẹp tiêu bản"]}'::jsonb),
  ('g6-st1-2026.1', 2, 'match', '“Tế bào da người” tương ứng với “Dẹt và xếp sát nhau”.', '{"leftItems":["Tế bào da người","Tế bào thần kinh","Tế bào thịt lá"],"rightItems":["Có dạng gần hình hộp","Có phần kéo dài","Dẹt và xếp sát nhau"]}'::jsonb),
  ('g6-st1-2026.1', 2, 'fill', 'Từ cần điền gồm 2 tiếng và bắt đầu bằng chữ “k”.', '{"sentence":"Các tế bào khác nhau có hình dạng và kích thước [blank]."}'::jsonb),
  ('g6-st1-2026.1', 2, 'category', '“Tế bào trứng đà điểu” thuộc nhóm “Có thể quan sát bằng mắt thường”.', '{"categories":["Có thể quan sát bằng mắt thường","Cần dụng cụ phóng đại"],"items":["Tế bào trứng đà điểu","Tế bào trứng cá","Tế bào vi khuẩn","Tế bào biểu bì hành"]}'::jsonb),
  ('g6-st1-2026.1', 2, 'dragdrop', 'Từ cần chọn gồm 3 tiếng và bắt đầu bằng chữ “k”.', '{"textWithBlanks":"Hầu hết tế bào có kích thước rất nhỏ và được quan sát bằng [blank].","bankWords":["kính hiển vi","nhiệt kế","ống đong"]}'::jsonb),
  ('g6-st1-2026.1', 3, 'match', '“Màng tế bào” tương ứng với “Bao bọc và kiểm soát trao đổi chất”.', '{"leftItems":["Màng tế bào","Tế bào chất","Nhân hoặc vùng nhân"],"rightItems":["Chứa vật chất di truyền","Nơi diễn ra phần lớn hoạt động sống","Bao bọc và kiểm soát trao đổi chất"]}'::jsonb),
  ('g6-st1-2026.1', 3, 'fill', 'Từ cần điền gồm 3 tiếng và bắt đầu bằng chữ “t”.', '{"sentence":"Phần lớn hoạt động sống của tế bào diễn ra trong [blank]."}'::jsonb),
  ('g6-st1-2026.1', 3, 'category', '“Màng tế bào” thuộc nhóm “Có ở mọi tế bào”.', '{"categories":["Có ở mọi tế bào","Chỉ có ở một số loại tế bào"],"items":["Màng tế bào","Tế bào chất","Vật chất di truyền","Lục lạp"]}'::jsonb),
  ('g6-st1-2026.1', 3, 'dragdrop', 'Từ cần chọn gồm 2 tiếng và bắt đầu bằng chữ “v”.', '{"textWithBlanks":"Thông tin di truyền của tế bào nằm trong nhân hoặc [blank].","bankWords":["vùng nhân","thành tế bào","không bào"]}'::jsonb),
  ('g6-st1-2026.1', 4, 'match', '“Tế bào vi khuẩn” tương ứng với “Nhân sơ, chưa có nhân hoàn chỉnh”.', '{"leftItems":["Tế bào vi khuẩn","Tế bào động vật","Tế bào thực vật"],"rightItems":["Nhân thực, có thành tế bào","Nhân thực, không có thành tế bào","Nhân sơ, chưa có nhân hoàn chỉnh"]}'::jsonb),
  ('g6-st1-2026.1', 4, 'fill', 'Từ cần điền gồm 2 tiếng và bắt đầu bằng chữ “n”.', '{"sentence":"Tế bào có nhân được màng nhân bao bọc gọi là tế bào [blank]."}'::jsonb),
  ('g6-st1-2026.1', 4, 'category', '“Vi khuẩn lactic” thuộc nhóm “Nhân sơ”.', '{"categories":["Nhân sơ","Nhân thực"],"items":["Vi khuẩn lactic","Vi khuẩn E. coli","Tế bào nấm men","Tế bào lá cây"]}'::jsonb),
  ('g6-st1-2026.1', 4, 'dragdrop', 'Từ cần chọn gồm 2 tiếng và bắt đầu bằng chữ “v”.', '{"textWithBlanks":"Ở tế bào nhân sơ, vật chất di truyền tập trung tại [blank].","bankWords":["vùng nhân","lục lạp","không bào"]}'::jsonb),
  ('g6-st1-2026.1', 5, 'match', '“Thành tế bào” tương ứng với “Giữ hình dạng và bảo vệ tế bào thực vật”.', '{"leftItems":["Thành tế bào","Lục lạp","Không bào"],"rightItems":["Chứa dịch tế bào","Thực hiện quang hợp","Giữ hình dạng và bảo vệ tế bào thực vật"]}'::jsonb),
  ('g6-st1-2026.1', 5, 'fill', 'Từ cần điền gồm 3 tiếng và bắt đầu bằng chữ “t”.', '{"sentence":"Tế bào thực vật có [blank] ở phía ngoài màng tế bào."}'::jsonb),
  ('g6-st1-2026.1', 5, 'category', '“Lục lạp” thuộc nhóm “Có ở tế bào thực vật nhưng không có ở tế bào động vật”.', '{"categories":["Có ở tế bào thực vật nhưng không có ở tế bào động vật","Có ở cả tế bào thực vật và động vật"],"items":["Lục lạp","Thành tế bào","Màng tế bào","Tế bào chất","Nhân"]}'::jsonb),
  ('g6-st1-2026.1', 5, 'dragdrop', 'Từ cần chọn gồm 2 tiếng và bắt đầu bằng chữ “l”.', '{"textWithBlanks":"Sắc tố diệp lục tập trung trong [blank] của tế bào thực vật.","bankWords":["lục lạp","nhân","màng tế bào"]}'::jsonb),
  ('g6-st1-2026.1', 6, 'match', '“Tế bào non” tương ứng với “Kích thước còn nhỏ”.', '{"leftItems":["Tế bào non","Tế bào trưởng thành","Trao đổi chất"],"rightItems":["Cung cấp vật chất cho tế bào lớn lên","Đạt kích thước nhất định","Kích thước còn nhỏ"]}'::jsonb),
  ('g6-st1-2026.1', 6, 'fill', 'Từ cần điền gồm 2 tiếng và bắt đầu bằng chữ “t”.', '{"sentence":"Tế bào non lớn dần thành tế bào [blank]."}'::jsonb),
  ('g6-st1-2026.1', 6, 'category', '“Tăng kích thước” thuộc nhóm “Biểu hiện của tế bào lớn lên”.', '{"categories":["Biểu hiện của tế bào lớn lên","Không phải biểu hiện của tế bào lớn lên"],"items":["Tăng kích thước","Tăng khối lượng","Tổng hợp thêm chất","Mất vật chất di truyền"]}'::jsonb),
  ('g6-st1-2026.1', 6, 'dragdrop', 'Từ cần chọn gồm 2 tiếng và bắt đầu bằng chữ “p”.', '{"textWithBlanks":"Tế bào lớn lên đến một kích thước nhất định rồi có thể tiến hành [blank].","bankWords":["phân chia","bay hơi","nảy mầm"]}'::jsonb),
  ('g6-st1-2026.1', 7, 'match', '“1 lần phân chia” tương ứng với “2 tế bào con”.', '{"leftItems":["1 lần phân chia","2 lần phân chia liên tiếp","3 lần phân chia liên tiếp"],"rightItems":["8 tế bào con","4 tế bào con","2 tế bào con"]}'::jsonb),
  ('g6-st1-2026.1', 7, 'fill', 'Từ cần điền gồm 2 tiếng và bắt đầu bằng chữ “l”.', '{"sentence":"Sự lớn lên và phân chia của tế bào là cơ sở cho sự [blank] của cơ thể."}'::jsonb),
  ('g6-st1-2026.1', 7, 'category', '“Tăng số lượng tế bào” thuộc nhóm “Vai trò của phân chia tế bào”.', '{"categories":["Vai trò của phân chia tế bào","Không phải vai trò của phân chia tế bào"],"items":["Tăng số lượng tế bào","Thay thế tế bào già","Làm lành vết thương","Làm mọi tế bào mất nhân"]}'::jsonb),
  ('g6-st1-2026.1', 7, 'dragdrop', 'Từ cần chọn gồm 2 tiếng và bắt đầu bằng chữ “p”.', '{"textWithBlanks":"Các tế bào mới sinh ra tiếp tục lớn lên và [blank].","bankWords":["phân chia","biến mất","ngừng trao đổi chất"]}'::jsonb),
  ('g6-st1-2026.1', 8, 'match', '“Lam kính” tương ứng với “Đặt mẫu quan sát”.', '{"leftItems":["Lam kính","Lamen","Ống nhỏ giọt"],"rightItems":["Nhỏ nước hoặc dung dịch lên mẫu","Đậy lên mẫu","Đặt mẫu quan sát"]}'::jsonb),
  ('g6-st1-2026.1', 8, 'fill', 'Từ cần điền gồm 1 tiếng và bắt đầu bằng chữ “b”.', '{"sentence":"Khi đậy lamen cần thao tác nhẹ để hạn chế tạo [blank] khí."}'::jsonb),
  ('g6-st1-2026.1', 8, 'category', '“Lam kính” thuộc nhóm “Dụng cụ làm tiêu bản”.', '{"categories":["Dụng cụ làm tiêu bản","Thiết bị quan sát"],"items":["Lam kính","Lamen","Ống nhỏ giọt","Kính hiển vi"]}'::jsonb),
  ('g6-st1-2026.1', 8, 'dragdrop', 'Từ cần chọn gồm 2 tiếng và bắt đầu bằng chữ “l”.', '{"textWithBlanks":"Tiêu bản biểu bì hành cần được đặt trên [blank] trước khi đậy lamen.","bankWords":["lam kính","thị kính","vật kính"]}'::jsonb),
  ('g6-st1-2026.1', 9, 'match', '“Tế bào lông hút” tương ứng với “Hấp thụ nước và muối khoáng”.', '{"leftItems":["Tế bào lông hút","Tế bào cơ","Tế bào thần kinh"],"rightItems":["Tiếp nhận và truyền tín hiệu","Co dãn tạo vận động","Hấp thụ nước và muối khoáng"]}'::jsonb),
  ('g6-st1-2026.1', 9, 'fill', 'Từ cần điền gồm 2 tiếng và bắt đầu bằng chữ “c”.', '{"sentence":"Hình dạng của tế bào thường phù hợp với [blank] mà tế bào đảm nhiệm."}'::jsonb),
  ('g6-st1-2026.1', 9, 'category', '“Tế bào lông hút” thuộc nhóm “Tế bào thực vật”.', '{"categories":["Tế bào thực vật","Tế bào động vật"],"items":["Tế bào lông hút","Tế bào thịt lá","Tế bào cơ","Tế bào thần kinh"]}'::jsonb),
  ('g6-st1-2026.1', 9, 'dragdrop', 'Từ cần chọn gồm 2 tiếng và bắt đầu bằng chữ “h”.', '{"textWithBlanks":"Tế bào lông hút có phần kéo dài giúp tăng diện tích [blank] nước và muối khoáng.","bankWords":["hấp thụ","quang hợp","phân chia"]}'::jsonb),
  ('g6-st1-2026.1', 10, 'match', '“Kính hiển vi” tương ứng với “Quan sát tế bào rất nhỏ”.', '{"leftItems":["Kính hiển vi","Màng tế bào","Phân chia tế bào"],"rightItems":["Làm tăng số lượng tế bào","Kiểm soát trao đổi chất","Quan sát tế bào rất nhỏ"]}'::jsonb),
  ('g6-st1-2026.1', 10, 'fill', 'Từ cần điền gồm 1 tiếng và bắt đầu bằng chữ “n”.', '{"sentence":"Tế bào thực vật và tế bào động vật đều có màng tế bào, tế bào chất và [blank]."}'::jsonb),
  ('g6-st1-2026.1', 10, 'category', '“Có không bào lớn ở tế bào trưởng thành” thuộc nhóm “Đúng với tế bào thực vật”.', '{"categories":["Đúng với tế bào thực vật","Đúng với tế bào vi khuẩn"],"items":["Có không bào lớn ở tế bào trưởng thành","Có thể có lục lạp","Thuộc kiểu tế bào nhân sơ","Chưa có nhân hoàn chỉnh"]}'::jsonb),
  ('g6-st1-2026.1', 10, 'dragdrop', 'Từ cần chọn gồm 2 tiếng và bắt đầu bằng chữ “p”.', '{"textWithBlanks":"Sự lớn lên và [blank] của tế bào giúp cơ thể sinh trưởng.","bankWords":["phân chia","bay hơi","hoà tan"]}'::jsonb);

  select id into v_admin_id from public.profiles where role = 'admin' order by id limit 1;
  if v_admin_id is null then raise exception 'station_hint_review_requires_admin_profile'; end if;
  for v_base in
    select r.* from public.station_content_releases r
    join (select distinct base_version from station_hint_review_values) h on h.base_version = r.version
    order by r.grade, r.station_id
  loop
    if (select count(*) from public.station_content_items where release_id = v_base.id) <> 50 then
      raise exception 'station_hint_review_requires_complete_release: %', v_base.version;
    end if;
    if v_base.status in ('draft', 'review') then
      update public.station_content_items i
      set public_content = jsonb_set(i.public_content, '{hint}', to_jsonb(h.hint), true), updated_at = now()
      from station_hint_review_values h
      where i.release_id = v_base.id and h.base_version = v_base.version
        and h.day_index = i.day_index and h.game_type = i.game_type
        and i.public_content - 'hint' = h.expected_content
        and i.public_content->>'hint' in (
          'Dựa vào kiến thức của ải ' || i.day_index || '.',
          'Dựa vào nội dung của ải ' || i.day_index || '.'
        );
      get diagnostics v_changed = row_count;
      if v_changed > 0 then
        update public.station_content_releases set status = 'review', updated_at = now()
        where id = v_base.id;
      end if;
      raise notice '%: % hints replaced; status review if changed', v_base.version, v_changed;
    elsif v_base.status = 'published' then
      if exists (select 1 from public.station_content_releases where version = v_base.version || '-hints.1') then
        raise notice '%: review clone already exists, skipped', v_base.version;
        continue;
      end if;
      insert into public.station_content_releases(version, grade, station_id, title, status, notes, created_by)
      values(v_base.version || '-hints.1', v_base.grade, v_base.station_id, v_base.title,
             'review', v_base.notes || ' | Rà gợi ý theo nội dung; chưa phát hành.', v_admin_id)
      returning id into v_new_id;
      insert into public.station_content_items(
        release_id, grade, station_id, day_index, game_index, game_type,
        title, learning_objective, public_content, answer_key, source_refs
      )
      select v_new_id, i.grade, i.station_id, i.day_index, i.game_index, i.game_type,
             i.title, i.learning_objective,
             case when h.hint is not null and i.public_content - 'hint' = h.expected_content
               and i.public_content->>'hint' in (
               'Dựa vào kiến thức của ải ' || i.day_index || '.',
               'Dựa vào nội dung của ải ' || i.day_index || '.'
             ) then jsonb_set(i.public_content, '{hint}', to_jsonb(h.hint), true)
               else i.public_content end,
             i.answer_key, i.source_refs
      from public.station_content_items i
      left join station_hint_review_values h
        on h.base_version = v_base.version and h.day_index = i.day_index and h.game_type = i.game_type
      where i.release_id = v_base.id;
      raise notice '%: review clone created as %; publication unchanged', v_base.version, v_base.version || '-hints.1';
    end if;
  end loop;
end;
$station_hints$;
