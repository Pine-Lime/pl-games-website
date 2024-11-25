import { NextResponse } from 'next/server'
import Replicate from "replicate"

// Flag to toggle between test mode and real processing
const USE_TEST_IMAGE = false
const TEST_IMAGE_URL = 'https://i.ibb.co/yX683RZ/default-filtered.webp'

export async function POST(request: Request) {
  try {
    const { imageUrl } = await request.json()
    
    let outputImageUrl: string

    if (USE_TEST_IMAGE) {
      outputImageUrl = TEST_IMAGE_URL
    } else {
      if (!process.env.REPLICATE_API_KEY) {
        throw new Error('Missing Replicate API key - please add REPLICATE_API_KEY to your environment variables')
      }
      const replicate = new Replicate({
        auth: process.env.REPLICATE_API_KEY,
      })

      const output = await replicate.run(
        "fofr/any-comfyui-workflow:10990543610c5a77a268f426adb817753842697fa0fa5819dc4a396b632a5c15",
        {
          input: {
            "workflow_json": `{\"3\":{\"inputs\":{\"seed\":74,\"steps\":25,\"cfg\":7,\"sampler_name\":\"dpmpp_2m\",\"scheduler\":\"karras\",\"denoise\":0.75,\"model\":[\"47\",0],\"positive\":[\"55\",0],\"negative\":[\"55\",1],\"latent_image\":[\"14\",0]},\"class_type\":\"KSampler\",\"_meta\":{\"title\":\"KSampler\"}},\"4\":{\"inputs\":{\"ckpt_name\":\"animagine-xl-3.0.safetensors\"},\"class_type\":\"CheckpointLoaderSimple\",\"_meta\":{\"title\":\"Load Checkpoint\"}},\"6\":{\"inputs\":{\"text\":\"a person, anime style\",\"clip\":[\"4\",1]},\"class_type\":\"CLIPTextEncode\",\"_meta\":{\"title\":\"CLIP Text Encode (Prompt)\"}},\"7\":{\"inputs\":{\"text\":\"blurry, noisy, messy, glitch, distorted, malformed, ill, horror, naked, nipples\",\"clip\":[\"4\",1]},\"class_type\":\"CLIPTextEncode\",\"_meta\":{\"title\":\"CLIP Text Encode (Prompt)\"}},\"8\":{\"inputs\":{\"samples\":[\"3\",0],\"vae\":[\"4\",2]},\"class_type\":\"VAEDecode\",\"_meta\":{\"title\":\"VAE Decode\"}},\"12\":{\"inputs\":{\"image\":\"${imageUrl}\",\"upload\":\"image\"},\"class_type\":\"LoadImage\",\"_meta\":{\"title\":\"Load Image\"}},\"14\":{\"inputs\":{\"pixels\":[\"61\",0],\"vae\":[\"4\",2]},\"class_type\":\"VAEEncode\",\"_meta\":{\"title\":\"VAE Encode\"}},\"15\":{\"inputs\":{\"filename_prefix\":\"ComfyUI\",\"images\":[\"8\",0]},\"class_type\":\"SaveImage\",\"_meta\":{\"title\":\"Save Image\"}},\"47\":{\"inputs\":{\"weight_style\":1,\"weight_composition\":1,\"expand_style\":false,\"combine_embeds\":\"average\",\"start_at\":0,\"end_at\":0.9,\"embeds_scaling\":\"V only\",\"model\":[\"48\",0],\"ipadapter\":[\"48\",1],\"image_style\":[\"50\",0],\"image_composition\":[\"12\",0],\"image_negative\":[\"64\",0]},\"class_type\":\"IPAdapterStyleComposition\",\"_meta\":{\"title\":\"IPAdapter Style & Composition SDXL\"}},\"48\":{\"inputs\":{\"preset\":\"PLUS (high strength)\",\"model\":[\"4\",0]},\"class_type\":\"IPAdapterUnifiedLoader\",\"_meta\":{\"title\":\"IPAdapter Unified Loader\"}},\"49\":{\"inputs\":{\"image\":\"https://pinelime-orders.s3.amazonaws.com/PetPortraitsFiles/anime_boy.jpeg\",\"upload\":\"image\"},\"class_type\":\"LoadImage\",\"_meta\":{\"title\":\"Load Image\"}},\"50\":{\"inputs\":{\"interpolation\":\"LANCZOS\",\"crop_position\":\"top\",\"sharpening\":0.1,\"image\":[\"49\",0]},\"class_type\":\"PrepImageForClipVision\",\"_meta\":{\"title\":\"Prep Image For ClipVision\"}},\"51\":{\"inputs\":{\"strength\":0.75,\"start_percent\":0,\"end_percent\":0.75,\"positive\":[\"6\",0],\"negative\":[\"7\",0],\"control_net\":[\"52\",0],\"image\":[\"53\",0]},\"class_type\":\"ControlNetApplyAdvanced\",\"_meta\":{\"title\":\"Apply ControlNet\"}},\"52\":{\"inputs\":{\"control_net_name\":\"control-lora-canny-rank128.safetensors\"},\"class_type\":\"ControlNetLoader\",\"_meta\":{\"title\":\"Load ControlNet Model\"}},\"53\":{\"inputs\":{\"low_threshold\":0.1,\"high_threshold\":0.3,\"image\":[\"61\",0]},\"class_type\":\"Canny\",\"_meta\":{\"title\":\"Canny\"}},\"54\":{\"inputs\":{\"images\":[\"61\",0]},\"class_type\":\"PreviewImage\",\"_meta\":{\"title\":\"Preview Image\"}},\"55\":{\"inputs\":{\"strength\":1,\"start_percent\":0,\"end_percent\":0.3,\"positive\":[\"51\",0],\"negative\":[\"51\",1],\"control_net\":[\"56\",0],\"image\":[\"57\",0]},\"class_type\":\"ControlNetApplyAdvanced\",\"_meta\":{\"title\":\"Apply ControlNet\"}},\"56\":{\"inputs\":{\"control_net_name\":\"control-lora-depth-rank256.safetensors\"},\"class_type\":\"ControlNetLoader\",\"_meta\":{\"title\":\"Load ControlNet Model\"}},\"57\":{\"inputs\":{\"ckpt_name\":\"depth_anything_vitl14.pth\",\"resolution\":960,\"image\":[\"61\",0]},\"class_type\":\"DepthAnythingPreprocessor\",\"_meta\":{\"title\":\"Depth Anything\"}},\"61\":{\"inputs\":{\"method\":\"keep proportion\",\"width\":1024,\"height\":1024,\"condition\":\"always\",\"interpolation\":\"nearest\",\"multiple_of\":0,\"image\":[\"12\",0]},\"class_type\":\"ImageResize+\",\"_meta\":{\"title\":\"Image Resize\"}},\"62\":{\"inputs\":{\"images\":[\"53\",0]},\"class_type\":\"PreviewImage\",\"_meta\":{\"title\":\"Preview Image\"}},\"63\":{\"inputs\":{\"images\":[\"57\",0]},\"class_type\":\"PreviewImage\",\"_meta\":{\"title\":\"Preview Image\"}},\"64\":{\"inputs\":{\"type\":\"gaussian\",\"strength\":0.75,\"blur\":0,\"image_optional\":[\"49\",0]},\"class_type\":\"IPAdapterNoise\",\"_meta\":{\"title\":\"IPAdapter Noise\"}}}`
          }
        }
      ) as string[]
      
      outputImageUrl = output[0]
    }

    // Handle ReadableStream
    const response = await fetch(outputImageUrl)
    const imageBlob = await response.blob()
    const arrayBuffer = await imageBlob.arrayBuffer()
    
    return new Response(arrayBuffer, {
      headers: {
        'Content-Type': 'image/webp',
        'Content-Length': arrayBuffer.byteLength.toString()
      }
    })
  } catch (error) {
    console.error('Error in stylize-image:', error)
    return NextResponse.json({ error: 'Failed to process image' }, { status: 500 })
  }
}
