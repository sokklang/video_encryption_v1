import java.io.*;
import java.net.*;
import java.nio.file.*;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class Server {
    private static final int PORT = 8080;
    private static final String HOST = "192.168.1.200";
    private static final int THREAD_POOL_SIZE = 10;

    public static void main(String[] args) {
        ExecutorService executor = Executors.newFixedThreadPool(THREAD_POOL_SIZE);

        try (ServerSocket serverSocket = new ServerSocket(PORT, 0, InetAddress.getByName(HOST))) {
            System.out.println("Server is running on http://" + HOST + ":" + PORT);

            while (true) {
                Socket clientSocket = serverSocket.accept();
                executor.submit(new HttpRequestHandler(clientSocket));
            }
        } catch (IOException e) {
            e.printStackTrace();
        } finally {
            executor.shutdown();
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
                    BufferedOutputStream out = new BufferedOutputStream(clientSocket.getOutputStream())) {

                String requestLine = in.readLine();
                log("Incoming request: " + requestLine);

                String[] parts = requestLine.split(" ");
                String method = parts[0];
                String uri = parts[1];

                if ("GET".equals(method)) {
                    serveFile(uri, out);
                } else {
                    sendResponse(out, "HTTP/1.1 405 Method Not Allowed\r\n\r\n".getBytes());
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

        private void serveFile(String uri, BufferedOutputStream out) throws IOException {
            try {
                File file = new File("public" + uri);
                if (file.exists() && !file.isDirectory()) {
                    byte[] content = Files.readAllBytes(file.toPath());
                    sendResponse(out, ("HTTP/1.1 200 OK\r\n" +
                            "Access-Control-Allow-Origin: *\r\n" +
                            "Content-Length: " + content.length + "\r\n" +
                            "\r\n").getBytes());
                    out.write(content);
                } else {
                    sendResponse(out, "HTTP/1.1 404 Not Found\r\nAccess-Control-Allow-Origin: *\r\n\r\n".getBytes());
                }
            } catch (SocketException e) {
                e.printStackTrace();
            }
        }

        private void sendResponse(BufferedOutputStream out, byte[] response) throws IOException {
            out.write(response);
            out.flush();
        }

        private void log(String message) {
            System.out.println(message);
        }
    }
}
