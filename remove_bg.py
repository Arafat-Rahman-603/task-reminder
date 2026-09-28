from PIL import Image

def remove_bg():
    img = Image.open('public/logo.png')
    img = img.convert('RGBA')
    datas = img.getdata()
    
    new_data = []
    # Dark background threshold
    for item in datas:
        # If the pixel is very dark (background is dark navy)
        if item[0] < 40 and item[1] < 40 and item[2] < 50:
            new_data.append((255, 255, 255, 0)) # transparent
        else:
            new_data.append(item)
            
    img.putdata(new_data)
    img.save('public/logo.png', 'PNG')

remove_bg()
