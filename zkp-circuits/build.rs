// Build script for compiling Plonky3 circuits with Rust optimizations
use std::env;

fn main() {
    // Enable CPU optimizations for Plonky3
    if cfg!(target_arch = "x86_64") {
        println!("cargo:rustc-env=RUSTFLAGS=-Ctarget-cpu=native");
    }
    
    // Enable parallel features for performance
    println!("cargo:rustc-cfg=feature=\"parallel\"");
    
    // Set optimization level
    if env::var("PROFILE").unwrap_or_default() == "release" {
        println!("cargo:rustc-env=RUST_OPT_LEVEL=3");
    }
    
    println!("cargo:rerun-if-changed=src/");
}