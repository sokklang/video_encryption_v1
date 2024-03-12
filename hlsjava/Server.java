import java.io.*;
import java.net.*;
import java.nio.file.*;

public class Server {
    public static void main(String[] args) {
        int port = 8080;
        String host = "localhost"; // Local network IP address
        try (ServerSocket serverSocket = new ServerSocket(port, 0, InetAddress.getByName(host))) {
            System.out.println("Server is running on http://" + host + ":" + port);

            while (true) {
                Socket clientSocket = serverSocket.accept();
                HttpRequestHandler requestHandler = new HttpRequestHandler(clientSocket);
                Thread thread = new Thread(requestHandler);
                thread.start();
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    static class HttpRequestHandler implements Runnable {
        private final Socket clientSocket;

        public HttpRequestHandler(Socket clientSocket) {
            this.clientSocket = clientSocket;
        }

        @Override
        public void run() {
            try (BufferedReader in = new BufferedReader(new InputStreamReader(clientSocket.getInputStream()));
                    OutputStream out = clientSocket.getOutputStream()) {

                String request = in.readLine();
                log("Incoming request: " + request); // Log incoming request

                String[] parts = request.split(" ");
                String method = parts[0];
                String uri = parts[1];

                if (method.equals("GET")) {
                    serveFile(uri, out);
                } else {
                    out.write("HTTP/1.1 405 Method Not Allowed\r\n\r\n".getBytes());
                }
            } catch (IOException e) {
                e.printStackTrace();
            } finally {
                try {
                    clientSocket.close();
                } catch (IOException e) {
                    e.printStackTrace();
                }
            }
        }

        private void serveFile(String uri, OutputStream out) throws IOException {
            try {
                File file = new File("public" + uri);
                if (file.exists() && !file.isDirectory()) {
                    byte[] content = Files.readAllBytes(file.toPath());
                    out.write("HTTP/1.1 200 OK\r\n".getBytes());
                    out.write("Access-Control-Allow-Origin: *\r\n".getBytes()); // Allow all origins
                    out.write(("Content-Length: " + content.length + "\r\n").getBytes());
                    out.write("\r\n".getBytes());
                    out.write(content);
                } else {
                    out.write("HTTP/1.1 404 Not Found\r\n".getBytes());
                    out.write("Access-Control-Allow-Origin: *\r\n".getBytes()); // Allow all origins
                    out.write("\r\n".getBytes());
                }
            } catch (SocketException e) {
                // Handle socket exception
                e.printStackTrace();
            }
        }

        private void log(String message) {
            System.out.println(message);
        }
    }
}
