const cloudinary = require("cloudinary").v2
const fs = require("fs/promises")

function uploadBuffer(buffer, options) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
      if (error) return reject(error)
      return resolve(result)
    })
    stream.end(buffer)
  })
}

exports.uploadImageToCloudinary = async (file, folder, height, quality) => {
  const options = { folder }
  if (height) {
    options.height = height
  }
  if (quality) {
    options.quality = quality
  }
  options.resource_type = "auto"

  if (Buffer.isBuffer(file.data) && file.data.length > 0) {
    return uploadBuffer(file.data, options)
  }

  if (!file.tempFilePath) {
    throw new Error("Uploaded media did not include readable content")
  }

  try {
    return await cloudinary.uploader.upload(file.tempFilePath, options)
  } finally {
    await fs.unlink(file.tempFilePath).catch(() => undefined)
  }
}
