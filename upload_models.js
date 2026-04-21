import fs from 'fs';
import path from 'path';
import axios from 'axios';
import FormData from 'form-data';

const CLOUD_NAME = 'de513yqvf';
const UPLOAD_PRESET = 'sinh_hoc_assets';
const MODELS_DIR = path.resolve('../public/models');
const OUTPUT_FILE = path.resolve('./cloudinary_models_map.json');

async function uploadFile(filePath, fileName) {
  try {
    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath));
    formData.append('upload_preset', UPLOAD_PRESET);
    formData.append('public_id', fileName.replace('.glb', ''));
    // For raw files like .glb, sometimes resource_type: 'raw' is needed, sometimes 'image' works as auto. 
    // We will use 'raw' as it's the standard for non-media files, or 'image' if they want transformation.
    // .glb usually requires 'raw' or 'image'. I will try 'raw' first, but if it fails, fallback to 'image'.

    // Endpoint for 'raw'
    const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/raw/upload`;
    
    console.log(`Uploading ${fileName}... (Size: ${(fs.statSync(filePath).size / 1024 / 1024).toFixed(2)} MB)`);
    
    const response = await axios.post(url, formData, {
      headers: formData.getHeaders(),
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });
    
    console.log(`✅ Success: ${fileName} -> ${response.data.secure_url}`);
    return response.data.secure_url;
  } catch (error) {
    console.error(`❌ Failed ${fileName}:`, error.response?.data || error.message);
    
    // Fallback to image resource_type
    if (error.response?.data?.error?.message?.includes('resource type')) {
        console.log(`Retrying ${fileName} as 'image'...`);
        try {
            const formData = new FormData();
            formData.append('file', fs.createReadStream(filePath));
            formData.append('upload_preset', UPLOAD_PRESET);
            formData.append('public_id', fileName.replace('.glb', ''));
            const imageurl = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;
            const resp = await axios.post(imageurl, formData, {
                 headers: formData.getHeaders(),
                 maxBodyLength: Infinity,
            });
            console.log(`✅ Success (as image): ${fileName} -> ${resp.data.secure_url}`);
            return resp.data.secure_url;
        } catch (e) {
             console.error(`❌ Fallback Failed ${fileName}:`, e.response?.data || e.message);
        }
    }
    return null;
  }
}

async function findGlobFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      findGlobFiles(filePath, fileList);
    } else if (file.endsWith('.glb') || file.endsWith('.gltf')) {
      fileList.push({ name: file, path: filePath });
    }
  }
  return fileList;
}

async function start() {
  console.log('--- Bắt đầu quét thư mục models ---');
  if (!fs.existsSync(MODELS_DIR)) {
      console.log('Không tìm thấy thư mục: ' + MODELS_DIR);
      return;
  }
  const files = await findGlobFiles(MODELS_DIR);
  console.log(`Tìm thấy ${files.length} file 3D (.glb / .gltf). Đang chuẩn bị Upload (có thể mất vài phút)...`);
  
  const map = {};
  for (const f of files) {
      const url = await uploadFile(f.path, f.name);
      if (url) {
          map[f.name] = url;
      }
  }
  
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(map, null, 2));
  console.log('--- Hoàn thành! Kết quả ghi vào cloudinary_models_map.json ---');
}

start();
