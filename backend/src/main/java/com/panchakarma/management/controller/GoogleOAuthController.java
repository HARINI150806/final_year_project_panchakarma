package com.panchakarma.management.controller;

import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;

@RestController
@RequestMapping("/api/google/oauth")
public class GoogleOAuthController {

    @Value("${google.calendar.client-id}")
    private String clientId;

    @Value("${google.calendar.client-secret}")
    private String clientSecret;

    @Value("${google.oauth.redirect-uri:https://final-year-project-panchakarma.onrender.com/api/google/oauth/callback}")
    private String redirectUri;

    @GetMapping("/authorize")
    public void authorize(HttpServletResponse response) throws IOException {
        String scope = "https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events";
        
        String authUrl = "https://accounts.google.com/o/oauth2/v2/auth" +
                "?client_id=" + URLEncoder.encode(clientId, StandardCharsets.UTF_8) +
                "&redirect_uri=" + URLEncoder.encode(redirectUri, StandardCharsets.UTF_8) +
                "&response_type=code" +
                "&scope=" + URLEncoder.encode(scope, StandardCharsets.UTF_8) +
                "&access_type=offline" +
                "&prompt=consent";

        response.sendRedirect(authUrl);
    }

    @GetMapping("/callback")
    public ResponseEntity<String> callback(@RequestParam(value = "code", required = false) String code,
                                           @RequestParam(value = "error", required = false) String error) {
        if (error != null) {
            return ResponseEntity.badRequest().body("Error from Google OAuth: " + error);
        }
        if (code == null) {
            return ResponseEntity.badRequest().body("Missing authorization code");
        }

        RestTemplate restTemplate = new RestTemplate();
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> map = new LinkedMultiValueMap<>();
        map.add("code", code);
        map.add("client_id", clientId);
        map.add("client_secret", clientSecret);
        map.add("redirect_uri", redirectUri);
        map.add("grant_type", "authorization_code");

        HttpEntity<MultiValueMap<String, String>> requestEntity = new HttpEntity<>(map, headers);

        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(
                    "https://oauth2.googleapis.com/token",
                    requestEntity,
                    Map.class
            );

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                Map<String, Object> body = response.getBody();
                String refreshToken = (String) body.get("refresh_token");
                String accessToken = (String) body.get("access_token");

                StringBuilder html = new StringBuilder();
                html.append("<html><body style='font-family: Arial, sans-serif; padding: 40px; background-color: #f7f9fa;'>");
                html.append("<div style='max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.05); border-top: 5px solid #2d6a4f;'>");
                html.append("<h2 style='color: #2d6a4f;'>Google OAuth Authorization Success!</h2>");
                html.append("<p>You have successfully authorized the Panchakarma Management application with Google.</p>");
                
                if (refreshToken != null) {
                    html.append("<div style='background: #e9f5ed; padding: 15px; border-radius: 5px; margin: 20px 0;'>");
                    html.append("<strong>Your Google Calendar Refresh Token:</strong>");
                    html.append("<pre style='word-break: break-all; white-space: pre-wrap; background: #fff; padding: 10px; border: 1px solid #c2e0cd; margin-top: 10px;'>").append(refreshToken).append("</pre>");
                    html.append("</div>");
                    html.append("<p style='color: #666;'>Please copy the refresh token above and add it to your <code>backend/.env</code> file as:</p>");
                    html.append("<pre style='background: #f1f3f5; padding: 10px; border-radius: 4px;'>GOOGLE_CALENDAR_REFRESH_TOKEN=").append(refreshToken).append("</pre>");
                    html.append("<p style='color: #666;'>Then restart the backend server to activate real Google Meet link generation.</p>");
                } else {
                    html.append("<p style='color: #f94144;'><strong>Warning:</strong> No refresh token was returned. If you are re-authorizing, please go to <a href='https://myaccount.google.com/permissions' target='_blank'>Google Account Permissions</a>, remove access for your app, and then run the authorization flow again.</p>");
                    html.append("<p>Access Token (temporary): <code>").append(accessToken).append("</code></p>");
                }
                
                html.append("</div></body></html>");

                return ResponseEntity.ok()
                        .header(HttpHeaders.CONTENT_TYPE, MediaType.TEXT_HTML_VALUE)
                        .body(html.toString());
            } else {
                return ResponseEntity.status(response.getStatusCode())
                        .body("Failed to exchange token. Google response: " + response.getBody());
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error exchanging authorization code: " + e.getMessage());
        }
    }
}
