Pod::Spec.new do |s|
  s.name           = 'ICloudDrive'
  s.version        = '1.0.0'
  s.summary        = 'Access to the app iCloud Drive ubiquity container'
  s.description    = 'Exposes the iCloud Drive Documents folder of the app container'
  s.author         = 'Janosch Hübner'
  s.homepage       = 'https://jnsh.me'
  s.platforms      = { :ios => '15.1' }
  s.source         = { git: '' }
  s.static_framework = true
  s.dependency 'ExpoModulesCore'
  s.pod_target_xcconfig = { 'DEFINES_MODULE' => 'YES' }
  s.source_files = '**/*.{h,m,swift}'
end
