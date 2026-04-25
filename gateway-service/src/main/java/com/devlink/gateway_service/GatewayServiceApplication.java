package com.devlink.gateway_service;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class GatewayServiceApplication {
	public static void main(String[] args) {
		System.setProperty(
				"reactor.netty.http.client.resolver",
				"default"
		);
		SpringApplication.run(GatewayServiceApplication.class, args);
	}
}