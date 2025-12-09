buildscript {
    repositories {
        // 优先使用国内镜像 - 解决中国网络问题
        maven { 
            url = uri("https://maven.aliyun.com/repository/google")
            content {
                includeGroupByRegex("com\\.android.*")
                includeGroupByRegex("com\\.google.*")
                includeGroupByRegex("androidx.*")
            }
        }
        maven { 
            url = uri("https://maven.aliyun.com/repository/public")
        }
        maven { 
            url = uri("https://maven.aliyun.com/repository/gradle-plugin")
        }
        
        // 腾讯云镜像作为备用
        maven { url = uri("https://mirrors.cloud.tencent.com/nexus/repository/maven-public/") }
        
        // 原始仓库放在最后作为兜底
        google()
        mavenCentral()
    }
    dependencies {
        classpath("com.android.tools.build:gradle:8.11.0")
        classpath("org.jetbrains.kotlin:kotlin-gradle-plugin:1.9.25")
    }
}

allprojects {
    repositories {
        // 优先使用国内镜像 - 解决中国网络问题
        maven { 
            url = uri("https://maven.aliyun.com/repository/google")
            content {
                includeGroupByRegex("com\\.android.*")
                includeGroupByRegex("com\\.google.*")
                includeGroupByRegex("androidx.*")
            }
        }
        maven { 
            url = uri("https://maven.aliyun.com/repository/public")
        }
        maven { 
            url = uri("https://maven.aliyun.com/repository/jcenter")
        }
        
        // 腾讯云镜像作为备用
        maven { url = uri("https://mirrors.cloud.tencent.com/nexus/repository/maven-public/") }
        
        // 华为镜像作为第三备用
        maven { url = uri("https://repo.huaweicloud.com/repository/maven/") }
        
        // 原始仓库放在最后作为兜底
        google()
        mavenCentral()
    }
}

tasks.register("clean").configure {
    delete("build")
}

