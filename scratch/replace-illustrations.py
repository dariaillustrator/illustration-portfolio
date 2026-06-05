import os
import sys
import json
import time
import random
import urllib.request
import urllib.parse
from PIL import Image

# Read .env manually
env = {}
try:
    with open('.env', 'r', encoding='utf-8') as f:
        content = f.read()
    for line in content.split('\n'):
        line = line.strip()
        if line and not line.startswith('#'):
            parts = line.split('=')
            if len(parts) >= 2:
                env[parts[0].strip()] = '='.join(parts[1:]).strip()
except Exception as e:
    print('Failed to read .env', e)
    sys.exit(1)

supabase_url = env.get('VITE_SUPABASE_URL')
supabase_service_key = env.get('SUPABASE_SERVICE_ROLE_KEY')
account_id = env.get('CLOUDFLARE_ACCOUNT_ID')
api_token = env.get('CLOUDFLARE_API_TOKEN')
bucket_name = env.get('CLOUDFLARE_R2_BUCKET', 'gallery')
public_url_base = env.get('CLOUDFLARE_R2_PUBLIC_URL')

if not all([supabase_url, supabase_service_key, account_id, api_token, public_url_base]):
    print("Missing environment variables in .env!")
    sys.exit(1)

local_dir = "/Users/dada/Downloads/DARIAILLUSTRATOR/DARIAPORTFOLIO"

def rgb_to_hsl(r, g, b):
    r /= 255.0
    g /= 255.0
    b /= 255.0
    
    mx = max(r, g, b)
    mn = min(r, g, b)
    h = s = l = (mx + mn) / 2.0
    
    if mx == mn:
        h = s = 0.0
    else:
        d = mx - mn
        s = d / (2.0 - mx - mn) if l > 0.5 else d / (mx + mn)
        if mx == r:
            h = (g - b) / d + (6.0 if g < b else 0.0)
        elif mx == g:
            h = (b - r) / d + 2.0
        elif mx == b:
            h = (r - g) / d + 4.0
        h /= 6.0
        
    return h, s, l

def analyze_image(image_path):
    img = Image.open(image_path)
    width, height = img.size
    aspect_ratio = width / height
    
    img_small = img.resize((50, 50), Image.Resampling.BILINEAR)
    img_rgb = img_small.convert('RGB')
    
    r_sum, g_sum, b_sum = 0, 0, 0
    pixels = img_rgb.getdata()
    for r, g, b in pixels:
        r_sum += r
        g_sum += g
        b_sum += b
        
    pixel_count = len(pixels)
    r_avg = r_sum / pixel_count
    g_avg = g_sum / pixel_count
    b_avg = b_sum / pixel_count
    
    h, s, l = rgb_to_hsl(r_avg, g_avg, b_avg)
    return aspect_ratio, h, s, l

def optimize_image(input_path, output_path, max_dimension=1600, quality=85):
    img = Image.open(input_path)
    width, height = img.size
    
    if width > max_dimension or height > max_dimension:
        if width > height:
            height = int(round((height * max_dimension) / width))
            width = max_dimension
        else:
            width = int(round((width * max_dimension) / height))
            height = max_dimension
            
    img_resized = img.resize((width, height), Image.Resampling.LANCZOS)
    img_resized_rgb = img_resized.convert('RGB')
    img_resized_rgb.save(output_path, 'JPEG', quality=quality)

def upload_file_to_r2(file_path, target_filename, content_type='image/jpeg'):
    with open(file_path, 'rb') as f:
        data = f.read()
        
    url = f"https://api.cloudflare.com/client/v4/accounts/{account_id}/r2/buckets/{bucket_name}/objects/{target_filename}"
    req = urllib.request.Request(
        url,
        data=data,
        headers={
            'Authorization': f'Bearer {api_token}',
            'Content-Type': content_type
        },
        method='PUT'
    )
    with urllib.request.urlopen(req) as response:
        res_data = json.loads(response.read().decode('utf-8'))
        if not res_data.get('success'):
            raise Exception(f"R2 upload failed: {res_data.get('errors')}")

def delete_object_from_r2(target_filename):
    url = f"https://api.cloudflare.com/client/v4/accounts/{account_id}/r2/buckets/{bucket_name}/objects/{target_filename}"
    req = urllib.request.Request(
        url,
        headers={
            'Authorization': f'Bearer {api_token}'
        },
        method='DELETE'
    )
    try:
        with urllib.request.urlopen(req) as response:
            res_data = json.loads(response.read().decode('utf-8'))
            if res_data.get('success'):
                print(f"  Deleted {target_filename} from R2.")
                return True
            else:
                print(f"  Failed to delete {target_filename} from R2:", res_data.get('errors'))
                return False
    except Exception as e:
        print(f"  Error deleting {target_filename} from R2:", e)
        return False

def make_supabase_request(path, method='GET', payload=None):
    url = f"{supabase_url}/rest/v1/{path}"
    headers = {
        'apikey': supabase_service_key,
        'Authorization': f'Bearer {supabase_service_key}',
        'Content-Type': 'application/json'
    }
    data = json.dumps(payload).encode('utf-8') if payload else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    with urllib.request.urlopen(req) as response:
        res_text = response.read().decode('utf-8')
        return json.loads(res_text) if res_text else None

def normalize_string(s):
    return ''.join(c for c in s.lower() if c.isalnum())

def get_clean_filename_from_url(url):
    try:
        parsed = urllib.parse.urlparse(url)
        path = parsed.path
        filename = path.split('/')[-1]
        return filename
    except Exception:
        return ""

def main():
    print("Fetching active gallery items from Supabase...")
    items = make_supabase_request("gallery_items?select=*")
    print(f"Found {len(items)} items in DB.")
    
    # Filter public active illustrations
    active_illustrations = [item for item in items if item['title'] not in ('__site_settings__', '__site_trash__')]
    print(f"Active public illustrations count: {len(active_illustrations)}")
    
    # List local files
    local_files = [f for f in os.listdir(local_dir) if f.lower().endswith(('.jpg', '.jpeg', '.png', '.gif'))]
    print(f"Local files in portfolio folder: {len(local_files)}")
    
    # Run replacement loop
    success_count = 0
    skipped_count = 0
    
    for item in active_illustrations:
        title = item['title']
        old_src = item['src']
        item_id = item['id']
        old_filename = get_clean_filename_from_url(old_src)
        
        print(f"\nProcessing '{title}' (ID: {item_id}, Old File: {old_filename})...")
        
        # Try to find a matching local file
        matched_file = None
        norm_title = normalize_string(title)
        norm_old_filename = normalize_string(old_filename.split('.')[0])
        
        for lf in local_files:
            lf_base = lf.split('.')[0]
            norm_lf = normalize_string(lf_base)
            if norm_lf == norm_title or norm_lf == norm_old_filename:
                matched_file = lf
                break
                
        if not matched_file:
            # Try matching by replacing space/underscore
            for lf in local_files:
                lf_base = lf.split('.')[0]
                norm_lf = normalize_string(lf_base.replace('_', '').replace(' ', ''))
                if norm_lf == norm_title.replace('_', '').replace(' ', ''):
                    matched_file = lf
                    break
                    
        if not matched_file:
            print(f"  [WARNING] Could not find a local file for '{title}' (Searched for normalized name '{norm_title}' or '{norm_old_filename}'). Skipping.")
            skipped_count += 1
            continue
            
        local_path = os.path.join(local_dir, matched_file)
        print(f"  Matched with local file: {matched_file} (Size: {os.path.getsize(local_path) / 1024 / 1024:.2f} MB)")
        
        # Define new filenames
        original_ext = matched_file.split('.')[-1].lower()
        timestamp = int(time.time() * 1000)
        random_str = ''.join(random.choice('abcdefghijklmnopqrstuvwxyz0123456789') for _ in range(9))
        
        new_base_name = f"{timestamp}_{random_str}"
        new_opt_filename = f"{new_base_name}.jpg"
        new_orig_filename = f"original_{new_base_name}.{original_ext}"
        
        # Create temp folder inside scratch if not exists
        os.makedirs("scratch", exist_ok=True)
        temp_opt_path = "scratch/temp_opt.jpg"
        
        # 1. Optimize image locally
        print("  Generating web-optimized version (max 1600px)...")
        optimize_image(local_path, temp_opt_path, 1600, 85)
        
        # 2. Analyze color metrics of the optimized image
        print("  Analyzing color metrics...")
        aspect_ratio, h, s, l = analyze_image(temp_opt_path)
        print(f"    Aspect Ratio: {aspect_ratio:.3f} | H: {h*360:.0f} | S: {s*100:.0f} | L: {l*100:.0f}")
        
        # 3. Delete old files from R2
        if old_filename:
            print(f"  Deleting old web-optimized file '{old_filename}' from R2...")
            delete_object_from_r2(old_filename)
            
            # Try deleting old original file as well
            old_base = old_filename.split('.')[0]
            old_parsed = urllib.parse.urlparse(old_src)
            oext = urllib.parse.parse_qs(old_parsed.query).get('oext', [None])[0]
            old_orig_ext = oext if oext else 'jpg'
            old_orig_filename = f"original_{old_base}.{old_orig_ext}"
            delete_object_from_r2(old_orig_filename)
            
        # 4. Upload new files to R2
        print(f"  Uploading new optimized file '{new_opt_filename}' to R2...")
        upload_file_to_r2(temp_opt_path, new_opt_filename, 'image/jpeg')
        
        print(f"  Uploading new original file '{new_orig_filename}' to R2 (untouched)...")
        mime_types = {'png': 'image/png', 'webp': 'image/webp', 'gif': 'image/gif'}
        content_type = mime_types.get(original_ext, 'image/jpeg')
        upload_file_to_r2(local_path, new_orig_filename, content_type)
        
        # 5. Update Supabase record
        clean_base = public_url_base[:-1] if public_url_base.endswith('/') else public_url_base
        new_src_url = f"{clean_base}/{new_opt_filename}"
        if original_ext not in ('jpg', 'jpeg'):
            new_src_url += f"?oext={original_ext}"
            
        print(f"  Updating Supabase DB for item '{title}'...")
        payload = {
            'src': new_src_url,
            'aspect_ratio': aspect_ratio,
            'hue': h,
            'saturation': s,
            'lightness': l
        }
        make_supabase_request(f"gallery_items?id=eq.{item_id}", 'PATCH', payload)
        print("  Update complete!")
        
        # Cleanup temp file
        if os.path.exists(temp_opt_path):
            os.remove(temp_opt_path)
            
        success_count += 1
        
    print(f"\nReplacement run completed: {success_count} succeeded, {skipped_count} skipped.")

if __name__ == "__main__":
    main()
