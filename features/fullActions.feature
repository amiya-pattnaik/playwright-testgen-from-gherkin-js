Feature: Full UI Interaction

  Scenario: User interacts with all UI elements
    Given I open the homepage
    When I enter username "tomsmith"
    And I enter password "SuperSecretPassword"
    And I click on the login button
    Then I should see "Welcome Tom!" in the welcome message
    When I hover over the user avatar
    And I double click the edit profile button
    And I select "India" from the country dropdown
    And I upload "resume.pdf" to the resume upload
    And I scroll to the footer section
    Then the logout button should be visible
